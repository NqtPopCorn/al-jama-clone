import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryReviewsDto } from '../dto/query-reviews.dto';
import { ReviewTemplateSummary } from '@aljama/shared';
import {
  ReviewItemStatusValue,
  ReviewRole,
  ReviewTemplateType,
  BaselineTriggerType,
  ReviewStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class ReviewQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách review cho Review Home Page (BR-REV-23, Screen 1)
   */
  async listReviews(currentUserId: string, query: QueryReviewsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.ReviewWhereInput = {};

    if (query.projectId) {
      baseWhere.projectId = query.projectId;
    }

    if (query.status) {
      baseWhere.status = query.status;
    }

    if (query.search) {
      baseWhere.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Đếm myCount và allCount cho 2 tabs trên header
    const [myTotal, allTotal] = await Promise.all([
      this.prisma.review.count({
        where: {
          ...baseWhere,
          participants: { some: { userId: currentUserId } },
        },
      }),
      this.prisma.review.count({
        where: {
          ...baseWhere,
          project: { members: { some: { userId: currentUserId } } },
        },
      }),
    ]);

    // Áp dụng scope
    const filterWhere: Prisma.ReviewWhereInput = {
      ...baseWhere,
      ...(query.scope === 'all'
        ? { project: { members: { some: { userId: currentUserId } } } }
        : { participants: { some: { userId: currentUserId } } }),
    };

    const reviews = await this.prisma.review.findMany({
      where: filterWhere,
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, fullName: true } },
        participants: {
          include: {
            user: { select: { id: true, fullName: true, username: true } },
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const items = reviews.map((r, index) => {
      const myParticipant = r.participants.find(p => p.userId === currentUserId);
      const moderators = r.participants
        .filter(p => p.reviewRole === 'MODERATOR')
        .map(p => p.user.fullName || p.user.username);

      return {
        id: r.id,
        key: `REV-${index + 1 + skip}`,
        name: r.name,
        projectId: r.projectId,
        projectName: r.project.name,
        isPublic: false,
        status: r.status,
        role: myParticipant?.reviewRole || null,
        revisionNumber: r.currentRevisionNumber,
        moderatorNames: moderators.length > 0 ? moderators : [r.creator.fullName],
        deadline: r.deadline ? r.deadline.toISOString() : null,
        itemCount: r._count.items,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return {
      items,
      total: query.scope === 'all' ? allTotal : myTotal,
      myCount: myTotal,
      allCount: allTotal,
      page,
      limit,
      totalPages: Math.ceil((query.scope === 'all' ? allTotal : myTotal) / limit),
    };
  }

  /**
   * Lấy dữ liệu chi tiết cho màn hình Review Execution Workspace (Screen 2 & 3)
   */
  async getReviewDetail(reviewId: string, currentUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: { select: { id: true, name: true } },
        template: true,
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, username: true, avatarUrl: true },
            },
          },
        },
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            item: {
              include: {
                itemType: { select: { id: true, name: true, icon: true } },
              },
            },
            itemVersionAtSend: true,
            statuses: {
              where: {
                revisionNumber: { equals: undefined }, // sẽ filter theo currentRevisionNumber
              },
            },
            _count: {
              select: { comments: true },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    // Kiểm tra quyền truy cập
    const myParticipant = review.participants.find(p => p.userId === currentUserId);
    if (!myParticipant && review.createdBy !== currentUserId) {
      throw new ForbiddenException('You do not have access to this review');
    }

    // Lấy danh sách Baseline của revision hiện tại để xác định snapshot nội dung và trạng thái đã chỉnh sửa
    let currentBaselines = await this.prisma.reviewBaseline.findMany({
      where: {
        reviewId: review.id,
        revisionNumber: review.currentRevisionNumber,
      },
      include: {
        itemVersion: true,
      },
    });

    // Nếu chưa có baseline (ví dụ review được seed hoặc legacy), tự động snapshot baseline ban đầu
    if (
      currentBaselines.length === 0 &&
      review.items.length > 0 &&
      review.status !== ReviewStatus.DRAFT
    ) {
      for (const ri of review.items) {
        const itemVersion = await this.prisma.itemVersion.findFirst({
          where: { itemId: ri.itemId },
          orderBy: { versionNumber: 'desc' },
        });
        if (itemVersion) {
          await this.prisma.reviewBaseline
            .create({
              data: {
                reviewId: review.id,
                revisionNumber: review.currentRevisionNumber,
                itemVersionId: itemVersion.id,
                triggerType: BaselineTriggerType.REVIEW_INITIATE,
              },
            })
            .catch(() => {});
        }
      }
      currentBaselines = await this.prisma.reviewBaseline.findMany({
        where: {
          reviewId: review.id,
          revisionNumber: review.currentRevisionNumber,
        },
        include: {
          itemVersion: true,
        },
      });
    }

    // Lấy trạng thái của toàn bộ items ở revision hiện tại kèm thông tin user
    const currentStatuses = await this.prisma.reviewItemStatus.findMany({
      where: {
        reviewItemId: { in: review.items.map(i => i.id) },
        revisionNumber: review.currentRevisionNumber,
      },
      include: {
        user: {
          select: { id: true, fullName: true, username: true, avatarUrl: true },
        },
      },
    });

    // Lấy comment count của revision hiện tại
    const commentsInRevision = await this.prisma.reviewComment.findMany({
      where: {
        reviewItemId: { in: review.items.map(i => i.id) },
        revisionNumber: review.currentRevisionNumber,
      },
      select: {
        reviewItemId: true,
        authorId: true,
      },
    });

    // Thống kê cá nhân
    let approvedCount = 0;
    let rejectedCount = 0;
    let reviewedCount = 0;
    let unmarkedCount = 0;
    let myCommentsCount = 0;
    let updatedSinceLastRevisionCount = 0;

    for (const c of commentsInRevision) {
      if (c.authorId === currentUserId) myCommentsCount++;
    }

    const approversCount = review.participants.filter(
      p => p.reviewRole === ReviewRole.APPROVER,
    ).length;

    const readingItems = review.items.map(ri => {
      // Trạng thái của current user cho item này
      const myStatusRow = currentStatuses.find(
        s => s.reviewItemId === ri.id && s.userId === currentUserId,
      );
      const statusVal = myStatusRow ? myStatusRow.status : ReviewItemStatusValue.NOT_REVIEWED;

      if (statusVal === ReviewItemStatusValue.APPROVED) approvedCount++;
      else if (statusVal === ReviewItemStatusValue.REJECTED) rejectedCount++;
      else if (statusVal === ReviewItemStatusValue.REVIEWED) reviewedCount++;
      else unmarkedCount++;

      const itemCommentsCount = commentsInRevision.filter(c => c.reviewItemId === ri.id).length;

      // Tính tổng hợp trạng thái duyệt của tất cả người tham gia cho item này
      const itemStatuses = currentStatuses.filter(s => s.reviewItemId === ri.id);
      const itemApprovedCount = itemStatuses.filter(
        s => s.status === ReviewItemStatusValue.APPROVED,
      ).length;
      const itemRejectedCount = itemStatuses.filter(
        s => s.status === ReviewItemStatusValue.REJECTED,
      ).length;
      const itemReviewedCount = itemStatuses.filter(
        s => s.status === ReviewItemStatusValue.REVIEWED,
      ).length;

      const approvedUsers = itemStatuses
        .filter(s => s.status === ReviewItemStatusValue.APPROVED)
        .map(s => ({
          userId: s.user.id,
          fullName: s.user.fullName || s.user.username,
          username: s.user.username,
          avatarUrl: s.user.avatarUrl,
        }));

      const rejectedUsers = itemStatuses
        .filter(s => s.status === ReviewItemStatusValue.REJECTED)
        .map(s => ({
          userId: s.user.id,
          fullName: s.user.fullName || s.user.username,
          username: s.user.username,
          avatarUrl: s.user.avatarUrl,
        }));

      // Xác định baseline version & snapshot tương ứng của item cho revision này
      const baseline = currentBaselines.find(b => b.itemVersion.itemId === ri.itemId);
      const baselineVersion = baseline
        ? baseline.itemVersion.versionNumber
        : ri.itemVersionAtSend?.versionNumber || 1;
      const baselineSnapshot = baseline
        ? (baseline.itemVersion.snapshot as Record<string, unknown> | null)
        : (ri.itemVersionAtSend?.snapshot as Record<string, unknown> | null);

      // QT: Item được đánh dấu edited nếu currentVersion trong database > baseline version
      const isEdited = ri.item.currentVersion > baselineVersion;
      if (isEdited) {
        updatedSinceLastRevisionCount++;
      }

      // NỘI DUNG HIỂN THỊ TRONG REVIEW: Giữ nguyên nội dung theo baseline của revision hiện tại!
      // KHÔNG cập nhật ngay cho đến khi Publish new revision.
      const displayName = (baselineSnapshot?.name as string) || ri.item.name;
      const displayDescription =
        baselineSnapshot?.description !== undefined
          ? (baselineSnapshot.description as string | null)
          : ri.item.description;
      const displayCustomFields =
        (baselineSnapshot?.customFields as Record<string, unknown> | null) ||
        (ri.item.customFields as Record<string, unknown> | null);

      return {
        id: ri.id,
        itemId: ri.itemId,
        itemKey: ri.item.itemKey,
        name: displayName,
        itemTypeName: ri.item.itemType?.name,
        itemTypeIcon: ri.item.itemType?.icon,
        orderIndex: ri.orderIndex,
        includeUpstream: ri.includeUpstream,
        includeDownstream: ri.includeDownstream,
        customFields: displayCustomFields,
        description: displayDescription,
        status: statusVal,
        commentCount: itemCommentsCount,
        hasUpdatedSinceLastRevision: isEdited,
        baselineVersion,
        latestVersion: ri.item.currentVersion,
        baselineContent: {
          name: displayName,
          description: displayDescription,
          customFields: displayCustomFields,
        },
        editedContent: isEdited
          ? {
              name: ri.item.name,
              description: ri.item.description,
              customFields: ri.item.customFields as Record<string, unknown> | null,
            }
          : null,
        overallStatusSummary: {
          approvedCount: itemApprovedCount,
          rejectedCount: itemRejectedCount,
          reviewedCount: itemReviewedCount,
          totalApprovers: approversCount,
          approvedUsers,
          rejectedUsers,
        },
      };
    });

    const participantsSummary = review.participants.map(p => ({
      id: p.id,
      reviewId: p.reviewId,
      userId: p.userId,
      username: p.user.username,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
      reviewRole: p.reviewRole,
      isSigner: p.isSigner,
      isFinished: p.isFinished,
      finishedAt: p.finishedAt ? p.finishedAt.toISOString() : null,
    }));

    const isUserModerator =
      review.createdBy === currentUserId || myParticipant?.reviewRole === ReviewRole.MODERATOR;

    const availableRoles: ('MODERATOR' | 'APPROVER' | 'REVIEWER')[] = [];
    if (isUserModerator) {
      availableRoles.push('MODERATOR');
      if (review.template.type === ReviewTemplateType.PEER) {
        availableRoles.push('REVIEWER');
      } else {
        availableRoles.push('APPROVER');
      }
    } else if (myParticipant?.reviewRole === ReviewRole.APPROVER) {
      availableRoles.push('APPROVER');
    } else if (myParticipant?.reviewRole === ReviewRole.REVIEWER) {
      availableRoles.push('REVIEWER');
    } else {
      availableRoles.push('REVIEWER');
    }

    return {
      id: review.id,
      key: `REV-${review.name.replace(/\s+/g, '-').toUpperCase()}`,
      name: review.name,
      description: review.description,
      projectId: review.projectId,
      projectName: review.project.name,
      template: {
        id: review.template.id,
        projectId: review.template.projectId,
        name: review.template.name,
        type: review.template.type,
        requiresSignature: review.template.requiresSignature,
        enableTimeTracking: review.template.enableTimeTracking,
        allowApproverAddParticipant: review.template.allowApproverAddParticipant,
        allowDelegate: review.template.allowDelegate,
        isEditableOnCreate: review.template.isEditableOnCreate,
      },
      status: review.status,
      deadline: review.deadline ? review.deadline.toISOString() : null,
      currentRevisionNumber: review.currentRevisionNumber,
      includeContext: review.includeContext,
      participants: participantsSummary,
      items: readingItems,
      myRole: myParticipant?.reviewRole || (isUserModerator ? ReviewRole.MODERATOR : 'REVIEWER'),
      myIsFinished: myParticipant?.isFinished || false,
      createdBy: review.createdBy,
      isModerator: isUserModerator,
      availableRoles,
      stats: {
        totalItems: review.items.length,
        approvedCount,
        rejectedCount,
        reviewedCount,
        unmarkedCount,
        totalComments: commentsInRevision.length,
        myCommentsCount,
        updatedSinceLastRevisionCount,
      },
    };
  }

  /**
   * Lấy danh sách review templates của dự án (BR-REV-05, QT-07)
   */
  async getProjectTemplates(
    projectId: string,
    currentUserId: string,
  ): Promise<ReviewTemplateSummary[]> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    let templates = await this.prisma.reviewTemplate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    // Nếu dự án chưa có template nào, tự động tạo 2 template mặc định (APPROVAL và PEER)
    if (templates.length === 0) {
      await this.prisma.reviewTemplate.createMany({
        data: [
          {
            projectId,
            name: 'Approval Review',
            type: ReviewTemplateType.APPROVAL,
            requiresSignature: true,
            enableTimeTracking: true,
            allowApproverAddParticipant: false,
            allowDelegate: false,
            isEditableOnCreate: false,
            createdBy: currentUserId,
          },
          {
            projectId,
            name: 'Peer Review',
            type: ReviewTemplateType.PEER,
            requiresSignature: false,
            enableTimeTracking: true,
            allowApproverAddParticipant: true,
            allowDelegate: true,
            isEditableOnCreate: true,
            createdBy: currentUserId,
          },
        ],
      });

      templates = await this.prisma.reviewTemplate.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return templates.map(t => ({
      id: t.id,
      projectId: t.projectId,
      name: t.name,
      type: t.type as unknown as import('@aljama/shared').ReviewTemplateType,
      requiresSignature: t.requiresSignature,
      enableTimeTracking: t.enableTimeTracking,
      allowApproverAddParticipant: t.allowApproverAddParticipant,
      allowDelegate: t.allowDelegate,
      isEditableOnCreate: t.isEditableOnCreate,
    }));
  }
}
