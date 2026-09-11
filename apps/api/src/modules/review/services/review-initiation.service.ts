import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { InitiateReviewDto } from '../dto/initiate-review.dto';
import {
  ReviewStatus,
  ReviewRole,
  ReviewTemplateType,
  ReviewItemStatusValue,
} from '@prisma/client';

@Injectable()
export class ReviewInitiationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Tạo một review mới ở trạng thái DRAFT (BR-REV-01 -> BR-REV-07)
   */
  async createReview(dto: CreateReviewDto, currentUserId: string) {
    // 1. Kiểm tra project tồn tại
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${dto.projectId} not found`);
    }

    // 2. Tìm hoặc tạo template mặc định nếu không truyền templateId
    let templateId = dto.templateId;
    if (!templateId) {
      let defaultTemplate = await this.prisma.reviewTemplate.findFirst({
        where: { projectId: dto.projectId, type: ReviewTemplateType.PEER },
      });
      if (!defaultTemplate) {
        defaultTemplate = await this.prisma.reviewTemplate.create({
          data: {
            projectId: dto.projectId,
            name: 'Standard Peer Review',
            type: ReviewTemplateType.PEER,
            requiresSignature: false,
            enableTimeTracking: true,
            allowApproverAddParticipant: true,
            allowDelegate: true,
            isEditableOnCreate: true,
            createdBy: currentUserId,
          },
        });
      }
      templateId = defaultTemplate.id;
    } else {
      const template = await this.prisma.reviewTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        throw new NotFoundException(`Review template ${templateId} not found`);
      }
    }

    // 3. Expand User Groups thành danh sách cá nhân (BR-REV-06)
    const participantsMap = new Map<
      string,
      { reviewRole: ReviewRole; isSigner: boolean; groupId?: string }
    >();

    for (const p of dto.participants) {
      if (p.userId) {
        participantsMap.set(p.userId, {
          reviewRole: p.reviewRole,
          isSigner: !!p.isSigner,
          groupId: p.groupId,
        });
      } else if (p.groupId) {
        const groupMembers = await this.prisma.userGroupMember.findMany({
          where: { groupId: p.groupId },
          select: { userId: true },
        });
        for (const member of groupMembers) {
          if (!participantsMap.has(member.userId)) {
            participantsMap.set(member.userId, {
              reviewRole: p.reviewRole,
              isSigner: !!p.isSigner,
              groupId: p.groupId,
            });
          }
        }
      }
    }

    // Luôn đảm bảo người tạo có mặt trong review với vai trò MODERATOR
    if (!participantsMap.has(currentUserId)) {
      participantsMap.set(currentUserId, {
        reviewRole: ReviewRole.MODERATOR,
        isSigner: false,
      });
    }

    // 4. Validate items tồn tại trong project
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: dto.itemIds },
        projectId: dto.projectId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (items.length === 0) {
      throw new BadRequestException('No valid items found in this project for review');
    }

    // 5. Tạo Review trong Database Transaction
    const review = await this.prisma.$transaction(async tx => {
      const createdReview = await tx.review.create({
        data: {
          projectId: dto.projectId,
          templateId: templateId!,
          name: dto.name,
          description: dto.description,
          status: ReviewStatus.DRAFT,
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          currentRevisionNumber: 1,
          includeContext: !!dto.includeContext,
          createdBy: currentUserId,
        },
      });

      // Tạo ReviewItems theo đúng thứ tự
      const itemData = dto.itemIds
        .filter(itemId => items.some(i => i.id === itemId))
        .map((itemId, index) => ({
          reviewId: createdReview.id,
          itemId,
          orderIndex: index + 1,
        }));

      await tx.reviewItem.createMany({
        data: itemData,
      });

      // Tạo ReviewParticipants
      const participantData = Array.from(participantsMap.entries()).map(([userId, details]) => ({
        reviewId: createdReview.id,
        userId,
        groupId: details.groupId || null,
        reviewRole: details.reviewRole,
        isSigner: details.isSigner,
      }));

      await tx.reviewParticipant.createMany({
        data: participantData,
      });

      return createdReview;
    });

    // 6. Nếu yêu cầu khởi chạy ngay
    if (dto.initiateImmediately) {
      return this.initiateReview(review.id, currentUserId);
    }

    return this.prisma.review.findUnique({
      where: { id: review.id },
      include: {
        items: true,
        participants: { include: { user: true } },
        template: true,
      },
    });
  }

  /**
   * Khởi chạy Review: Chuyển DRAFT -> ACTIVE, tạo Revision #1, tạo Baseline snapshot và khởi tạo status (BR-REV-09, BR-REV-38)
   */
  async initiateReview(reviewId: string, currentUserId: string, dto?: InitiateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        items: {
          include: {
            item: {
              select: { id: true, currentVersion: true },
            },
          },
        },
        participants: true,
        template: true,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    // Kiểm tra quyền Moderator
    const userParticipant = review.participants.find(
      p => p.userId === currentUserId && p.reviewRole === ReviewRole.MODERATOR,
    );
    if (!userParticipant && review.createdBy !== currentUserId) {
      throw new ForbiddenException('Only a review moderator can initiate the review');
    }

    // Pre-condition: Chỉ initiate từ DRAFT
    if (review.status !== ReviewStatus.DRAFT) {
      throw new ConflictException(
        `Review is already ${review.status.toLowerCase()}, cannot initiate`,
      );
    }

    // Pre-condition: Phải có >= 1 item và >= 1 participant
    if (review.items.length === 0) {
      throw new BadRequestException('Cannot initiate a review with 0 items');
    }
    if (review.participants.length === 0) {
      throw new BadRequestException('Cannot initiate a review with 0 participants');
    }

    // Thực hiện trong Transaction
    await this.prisma.$transaction(async tx => {
      // 1. Cập nhật review sang ACTIVE
      await tx.review.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.ACTIVE,
          currentRevisionNumber: 1,
          deadline: dto?.deadline ? new Date(dto.deadline) : review.deadline,
        },
      });

      // 2. Tạo Revision 1
      await tx.reviewRevision.create({
        data: {
          reviewId,
          revisionNumber: 1,
          changeDescription: dto?.message || 'Initial review revision initiated',
          publishedBy: currentUserId,
        },
      });

      // 3. Snapshot Item Versions vào ReviewBaseline (BR-REV-38)
      for (const ri of review.items) {
        // Tìm ItemVersion tương ứng với currentVersion của item
        const itemVersion = await tx.itemVersion.findFirst({
          where: {
            itemId: ri.itemId,
            versionNumber: ri.item.currentVersion,
          },
        });

        if (itemVersion) {
          await tx.reviewBaseline.create({
            data: {
              reviewId,
              revisionNumber: 1,
              itemVersionId: itemVersion.id,
            },
          });
        }
      }

      // 4. Khởi tạo ReviewItemStatus = NOT_REVIEWED cho toàn bộ (Item x Participant)
      const initialStatuses = [];
      for (const ri of review.items) {
        for (const rp of review.participants) {
          initialStatuses.push({
            reviewItemId: ri.id,
            participantId: rp.id,
            userId: rp.userId,
            revisionNumber: 1,
            status: ReviewItemStatusValue.NOT_REVIEWED,
          });
        }
      }

      await tx.reviewItemStatus.createMany({
        data: initialStatuses,
        skipDuplicates: true,
      });
    });

    // 5. Phát Event để Notification Module gửi email (BR-REV-09, BR-REV-10)
    this.eventEmitter.emit('review.initiated', {
      reviewId: review.id,
      reviewName: review.name,
      projectId: review.projectId,
      moderatorId: currentUserId,
      revisionNumber: 1,
      participantUserIds: review.participants.map(p => p.userId),
      deadline: review.deadline,
    });

    return this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        items: true,
        participants: { include: { user: true } },
        revisions: true,
        baselines: true,
      },
    });
  }
}
