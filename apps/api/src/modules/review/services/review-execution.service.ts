import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateReviewItemStatusDto } from '../dto/update-review-item-status.dto';
import { BatchUpdateStatusDto } from '../dto/batch-update-status.dto';
import {
  ReviewStatus,
  ReviewRole,
  ReviewItemStatusValue,
  ReviewCommentLabel,
} from '@prisma/client';

@Injectable()
export class ReviewExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Cập nhật trạng thái duyệt của một item trong review (BR-REV-14, BR-REV-15, QT-04, A-P2-02)
   */
  async updateItemStatus(
    reviewId: string,
    reviewItemId: string,
    currentUserId: string,
    dto: UpdateReviewItemStatusDto,
  ) {
    // 1. Kiểm tra review
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { items: true },
    });
    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    if (review.status !== ReviewStatus.ACTIVE) {
      throw new ConflictException(
        `Cannot update status because review is in ${review.status} state. Reviews must be ACTIVE.`,
      );
    }

    // 2. Kiểm tra item thuộc review
    const reviewItem = review.items.find(i => i.id === reviewItemId);
    if (!reviewItem) {
      throw new NotFoundException(
        `ReviewItem ${reviewItemId} does not belong to review ${reviewId}`,
      );
    }

    // 3. Kiểm tra participant
    const participant = await this.prisma.reviewParticipant.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: currentUserId,
        },
      },
    });
    if (!participant) {
      throw new ForbiddenException('You are not a participant in this review');
    }

    // 4. Validate Role theo QT-04: Reviewer ≠ Approver status set
    if (participant.reviewRole === ReviewRole.REVIEWER) {
      if (
        dto.status === ReviewItemStatusValue.APPROVED ||
        dto.status === ReviewItemStatusValue.REJECTED
      ) {
        throw new ForbiddenException(
          'Reviewers can only mark items as REVIEWED or NOT_REVIEWED (QT-04)',
        );
      }
    }

    // 5. Quy tắc bắt buộc Comment khi Reject (A-P2-02, User confirmed)
    if (dto.status === ReviewItemStatusValue.REJECTED) {
      if (!dto.rejectionComment || dto.rejectionComment.trim().length === 0) {
        throw new BadRequestException(
          'A comment explaining the reason is required when rejecting an item',
        );
      }
    }

    // 6. Cập nhật trạng thái trong Transaction
    const result = await this.prisma.$transaction(async tx => {
      // Upsert ReviewItemStatus tại currentRevisionNumber
      const updatedStatus = await tx.reviewItemStatus.upsert({
        where: {
          reviewItemId_userId_revisionNumber: {
            reviewItemId,
            userId: currentUserId,
            revisionNumber: review.currentRevisionNumber,
          },
        },
        create: {
          reviewItemId,
          participantId: participant.id,
          userId: currentUserId,
          revisionNumber: review.currentRevisionNumber,
          status: dto.status,
        },
        update: {
          status: dto.status,
        },
      });

      // Nếu là REJECTED kèm lý do -> Tạo tự động một ReviewComment với label ISSUE
      if (dto.status === ReviewItemStatusValue.REJECTED && dto.rejectionComment) {
        await tx.reviewComment.create({
          data: {
            reviewItemId,
            authorId: currentUserId,
            revisionNumber: review.currentRevisionNumber,
            label: ReviewCommentLabel.ISSUE,
            content: dto.rejectionComment.trim(),
          },
        });
      }

      return updatedStatus;
    });

    this.eventEmitter.emit('review.item_status_changed', {
      reviewId,
      reviewItemId,
      itemId: reviewItem.itemId,
      userId: currentUserId,
      userRole: participant.reviewRole,
      status: dto.status,
      rejectionComment: dto.rejectionComment,
      revisionNumber: review.currentRevisionNumber,
    });

    return result;
  }

  /**
   * Cập nhật trạng thái hàng loạt cho nhiều items (BR-REV-15)
   */
  async batchUpdateItemStatus(reviewId: string, currentUserId: string, dto: BatchUpdateStatusDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { items: true },
    });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    if (review.status !== ReviewStatus.ACTIVE) {
      throw new ConflictException('Review must be ACTIVE for batch updates');
    }

    const participant = await this.prisma.reviewParticipant.findUnique({
      where: { reviewId_userId: { reviewId, userId: currentUserId } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    // QT-04 Check
    if (participant.reviewRole === ReviewRole.REVIEWER) {
      if (
        dto.status === ReviewItemStatusValue.APPROVED ||
        dto.status === ReviewItemStatusValue.REJECTED
      ) {
        throw new ForbiddenException('Reviewers cannot batch Approve/Reject');
      }
    }

    // Validate Rejection Comment
    if (dto.status === ReviewItemStatusValue.REJECTED) {
      if (!dto.rejectionComment || dto.rejectionComment.trim().length === 0) {
        throw new BadRequestException('A reason is required when batch rejecting items');
      }
    }

    // Execute batch in transaction
    await this.prisma.$transaction(async tx => {
      for (const reviewItemId of dto.reviewItemIds) {
        await tx.reviewItemStatus.upsert({
          where: {
            reviewItemId_userId_revisionNumber: {
              reviewItemId,
              userId: currentUserId,
              revisionNumber: review.currentRevisionNumber,
            },
          },
          create: {
            reviewItemId,
            participantId: participant.id,
            userId: currentUserId,
            revisionNumber: review.currentRevisionNumber,
            status: dto.status,
          },
          update: {
            status: dto.status,
          },
        });

        if (dto.status === ReviewItemStatusValue.REJECTED && dto.rejectionComment) {
          await tx.reviewComment.create({
            data: {
              reviewItemId,
              authorId: currentUserId,
              revisionNumber: review.currentRevisionNumber,
              label: ReviewCommentLabel.ISSUE,
              content: dto.rejectionComment.trim(),
            },
          });
        }
      }
    });

    for (const reviewItemId of dto.reviewItemIds) {
      const reviewItem = review.items.find(i => i.id === reviewItemId);
      this.eventEmitter.emit('review.item_status_changed', {
        reviewId,
        reviewItemId,
        itemId: reviewItem?.itemId,
        userId: currentUserId,
        userRole: participant.reviewRole,
        status: dto.status,
        rejectionComment: dto.rejectionComment,
        revisionNumber: review.currentRevisionNumber,
      });
    }

    return { success: true, updatedCount: dto.reviewItemIds.length };
  }

  /**
   * Hoàn thành Review cá nhân ("I'm Finished") (BR-REV-20, BR-REV-21, QT-06)
   */
  async completeReview(reviewId: string, currentUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        items: true,
      },
    });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    const participant = await this.prisma.reviewParticipant.findUnique({
      where: { reviewId_userId: { reviewId, userId: currentUserId } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    // QT-06 Check: Nếu người này (hoặc trong review) có bất kỳ item nào REJECTED ở revision hiện tại
    const userRejectionsCount = await this.prisma.reviewItemStatus.count({
      where: {
        reviewItemId: { in: review.items.map(i => i.id) },
        userId: currentUserId,
        revisionNumber: review.currentRevisionNumber,
        status: ReviewItemStatusValue.REJECTED,
      },
    });

    if (userRejectionsCount > 0) {
      throw new ConflictException(
        `Cannot complete review: You have ${userRejectionsCount} rejected item(s). Please request a new revision instead (QT-06).`,
      );
    }

    // Đánh dấu participant isFinished
    const updated = await this.prisma.reviewParticipant.update({
      where: { id: participant.id },
      data: {
        isFinished: true,
        finishedAt: new Date(),
      },
    });

    this.eventEmitter.emit('review.participant_finished', {
      reviewId,
      userId: currentUserId,
      reviewRole: participant.reviewRole,
    });

    return updated;
  }

  /**
   * Đóng nhận phản hồi review (QT-09: Close for Feedback trước khi batch edit hoặc hoàn tất)
   */
  async closeForFeedback(reviewId: string, currentUserId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    const participant = await this.prisma.reviewParticipant.findUnique({
      where: { reviewId_userId: { reviewId, userId: currentUserId } },
    });
    if (review.createdBy !== currentUserId && participant?.reviewRole !== ReviewRole.MODERATOR) {
      throw new ForbiddenException('Only a Moderator can close the review for feedback');
    }

    if (review.status !== ReviewStatus.ACTIVE) {
      throw new ConflictException('Review must be ACTIVE to close for feedback');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.CLOSED_FOR_FEEDBACK },
    });

    this.eventEmitter.emit('review.status_changed', {
      reviewId,
      status: ReviewStatus.CLOSED_FOR_FEEDBACK,
      userId: currentUserId,
    });

    return updated;
  }

  /**
   * Mở lại nhận phản hồi review (Reopen review)
   */
  async reopenReview(reviewId: string, currentUserId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    const participant = await this.prisma.reviewParticipant.findUnique({
      where: { reviewId_userId: { reviewId, userId: currentUserId } },
    });
    if (review.createdBy !== currentUserId && participant?.reviewRole !== ReviewRole.MODERATOR) {
      throw new ForbiddenException('Only a Moderator can reopen the review');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.ACTIVE },
    });

    this.eventEmitter.emit('review.status_changed', {
      reviewId,
      status: ReviewStatus.ACTIVE,
      userId: currentUserId,
    });

    return updated;
  }

  /**
   * Hoàn tất đợt Review (Finalize Review / Complete Review & Baseline) (QT-06)
   */
  async finalizeReview(reviewId: string, currentUserId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { items: true },
    });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    const participant = await this.prisma.reviewParticipant.findUnique({
      where: { reviewId_userId: { reviewId, userId: currentUserId } },
    });
    if (review.createdBy !== currentUserId && participant?.reviewRole !== ReviewRole.MODERATOR) {
      throw new ForbiddenException('Only a Moderator can finalize the review');
    }

    // QT-06: Kiểm tra nếu còn item nào bị REJECTED ở revision hiện tại
    const rejectedCount = await this.prisma.reviewItemStatus.count({
      where: {
        reviewItemId: { in: review.items.map(i => i.id) },
        revisionNumber: review.currentRevisionNumber,
        status: ReviewItemStatusValue.REJECTED,
      },
    });

    if (rejectedCount > 0) {
      throw new ConflictException(
        `Cannot finalize review: ${rejectedCount} item(s) have been rejected. A new revision must be published and resolved before finalizing (QT-06).`,
      );
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.FINALIZED },
    });

    this.eventEmitter.emit('review.finalized', {
      reviewId,
      userId: currentUserId,
    });

    return updated;
  }
}

