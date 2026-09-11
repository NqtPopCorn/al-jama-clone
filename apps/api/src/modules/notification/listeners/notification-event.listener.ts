import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CommentMentionedPayload {
  mentionedUserId: string;
  commentId: string;
  authorId: string;
  authorName?: string;
  itemId?: string;
  itemName?: string;
  projectId?: string;
  projectName?: string;
}

export interface ReviewInitiatedPayload {
  reviewId: string;
  reviewName: string;
  projectId: string;
  moderatorId: string;
  moderatorName?: string;
  revisionNumber: number;
  participantUserIds: string[];
  deadline?: Date | string | null;
}

export interface ReviewParticipantAddedPayload {
  reviewId: string;
  reviewName?: string;
  addedByUserId: string;
  addedByName?: string;
  participantUserId: string;
  reviewRole: string;
  deadline?: Date | string | null;
}

export interface ReviewCommentMentionedPayload {
  reviewId: string;
  reviewItemId?: string;
  commentId: string;
  mentionedUserIds: string[];
  authorId: string;
  authorName?: string;
  reviewName?: string;
}

export interface ReviewParticipantFinishedPayload {
  reviewId: string;
  userId: string;
  userName?: string;
  reviewRole: string;
}

export interface ReviewRevisionPublishedPayload {
  reviewId: string;
  reviewName: string;
  revisionNumber: number;
  moderatorId: string;
  participantUserIds: string[];
}

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 1. Xử lý @mention trong Collaboration Stream Comment
   */
  @OnEvent('comment.mentioned')
  async handleCommentMentionedEvent(payload: CommentMentionedPayload) {
    this.logger.log(`Received comment.mentioned event for user ${payload.mentionedUserId}`);

    const targetTitle = payload.itemName || payload.projectName || 'an item';
    const authorText = payload.authorName || 'A team member';
    const linkUrl = payload.itemId
      ? `/items/${payload.itemId}`
      : payload.projectId
        ? `/projects/${payload.projectId}`
        : null;

    // In-App Notification (AC-06)
    try {
      await this.prisma.notification.create({
        data: {
          userId: payload.mentionedUserId,
          type: 'COMMENT_MENTION',
          title: 'You were mentioned in a comment',
          content: `${authorText} mentioned you on ${targetTitle}`,
          linkUrl,
          isRead: false,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to create in-app notification: ${err.message}`, err.stack);
    }

    // BullMQ Queue
    try {
      await this.emailQueue.add('send-mention-email', payload);
    } catch (err: any) {
      this.logger.error(`Failed to queue email notification: ${err.message}`, err.stack);
    }
  }

  /**
   * 2. Xử lý Review Initiated: Gửi lời mời tới tất cả participant (trừ Moderator)
   */
  @OnEvent('review.initiated')
  async handleReviewInitiated(payload: ReviewInitiatedPayload) {
    this.logger.log(
      `Received review.initiated event for Review ${payload.reviewId} (${payload.reviewName})`,
    );

    const deadlineText = payload.deadline
      ? ` (Deadline: ${new Date(payload.deadline).toLocaleDateString()})`
      : '';
    const authorText = payload.moderatorName || 'Moderator';
    const linkUrl = `/reviews/${payload.reviewId}`;

    const targetParticipants = (payload.participantUserIds || []).filter(
      userId => userId !== payload.moderatorId,
    );

    for (const participantId of targetParticipants) {
      // 1. In-App Notification
      try {
        await this.prisma.notification.create({
          data: {
            userId: participantId,
            type: 'REVIEW_INVITATION',
            title: `Review Invitation: ${payload.reviewName}`,
            content: `${authorText} invited you to participate in review "${payload.reviewName}"${deadlineText}`,
            linkUrl,
            isRead: false,
          },
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to create review invitation notification for user ${participantId}: ${err.message}`,
          err.stack,
        );
      }

      // 2. BullMQ Email Job
      try {
        await this.emailQueue.add('send-review-invitation-email', {
          reviewId: payload.reviewId,
          reviewName: payload.reviewName,
          participantUserId: participantId,
          moderatorId: payload.moderatorId,
          deadline: payload.deadline,
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to queue review invitation email for user ${participantId}: ${err.message}`,
          err.stack,
        );
      }
    }
  }

  /**
   * 3. Xử lý Participant Added: Moderator thêm participant giữa chừng
   */
  @OnEvent('review.participant_added')
  async handleReviewParticipantAdded(payload: ReviewParticipantAddedPayload) {
    this.logger.log(
      `Received review.participant_added for User ${payload.participantUserId} in Review ${payload.reviewId}`,
    );

    const reviewTitle = payload.reviewName || 'a review';
    const linkUrl = `/reviews/${payload.reviewId}`;

    // In-App Notification
    try {
      await this.prisma.notification.create({
        data: {
          userId: payload.participantUserId,
          type: 'REVIEW_INVITATION',
          title: `Added to Review: ${reviewTitle}`,
          content: `You have been added as a ${payload.reviewRole.toLowerCase()} to review "${reviewTitle}"`,
          linkUrl,
          isRead: false,
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to create notification for added participant: ${err.message}`,
        err.stack,
      );
    }

    // BullMQ Email Job
    try {
      await this.emailQueue.add('send-review-invitation-email', {
        reviewId: payload.reviewId,
        reviewName: payload.reviewName,
        participantUserId: payload.participantUserId,
        moderatorId: payload.addedByUserId,
        deadline: payload.deadline,
      });
    } catch (err: any) {
      this.logger.error(`Failed to queue email for added participant: ${err.message}`, err.stack);
    }
  }

  /**
   * 4. Xử lý @mention trong Review Comment
   */
  @OnEvent('review.comment_mentioned')
  async handleReviewCommentMentioned(payload: ReviewCommentMentionedPayload) {
    this.logger.log(
      `Received review.comment_mentioned for Comment ${payload.commentId} in Review ${payload.reviewId}`,
    );

    const authorText = payload.authorName || 'A team member';
    const linkUrl = payload.reviewItemId
      ? `/reviews/${payload.reviewId}?reviewItemId=${payload.reviewItemId}`
      : `/reviews/${payload.reviewId}`;

    const targetUsers = (payload.mentionedUserIds || []).filter(
      userId => userId !== payload.authorId,
    );

    for (const userId of targetUsers) {
      // In-App Notification
      try {
        await this.prisma.notification.create({
          data: {
            userId,
            type: 'REVIEW_COMMENT_MENTION',
            title: 'Mentioned in Review comment',
            content: `${authorText} mentioned you in a review comment`,
            linkUrl,
            isRead: false,
          },
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to create review comment mention notification for user ${userId}: ${err.message}`,
          err.stack,
        );
      }

      // BullMQ Email Job
      try {
        await this.emailQueue.add('send-review-mention-email', {
          reviewId: payload.reviewId,
          reviewItemId: payload.reviewItemId,
          commentId: payload.commentId,
          mentionedUserId: userId,
          authorId: payload.authorId,
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to queue review mention email for user ${userId}: ${err.message}`,
          err.stack,
        );
      }
    }
  }

  /**
   * 5. Xử lý Participant Finished: Thông báo Moderator khi người tham gia hoàn tất review
   */
  @OnEvent('review.participant_finished')
  async handleReviewParticipantFinished(payload: ReviewParticipantFinishedPayload) {
    this.logger.log(
      `Received review.participant_finished for User ${payload.userId} in Review ${payload.reviewId}`,
    );

    try {
      const review = await this.prisma.review.findUnique({
        where: { id: payload.reviewId },
        select: {
          createdBy: true,
          name: true,
          participants: {
            where: { reviewRole: 'MODERATOR' },
            select: { userId: true },
          },
        },
      });

      if (!review) return;

      const moderatorId = review.participants?.[0]?.userId || review.createdBy;

      // Không tự gửi thông báo nếu moderator tự finish review của mình
      if (moderatorId === payload.userId) return;

      const userText = payload.userName || 'A participant';
      const roleText = payload.reviewRole ? ` (${payload.reviewRole.toLowerCase()})` : '';

      // In-App Notification gửi cho Moderator
      await this.prisma.notification.create({
        data: {
          userId: moderatorId,
          type: 'REVIEW_PARTICIPANT_FINISHED',
          title: 'Participant Finished Review',
          content: `${userText}${roleText} has completed their review on "${review.name}"`,
          linkUrl: `/reviews/${payload.reviewId}`,
          isRead: false,
        },
      });

      // BullMQ Email Job
      await this.emailQueue.add('send-participant-finished-email', {
        reviewId: payload.reviewId,
        reviewName: review.name,
        moderatorId,
        participantUserId: payload.userId,
        reviewRole: payload.reviewRole,
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to handle participant finished notification: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * 6. Xử lý Revision Published (Sẵn sàng cho E7/E8)
   */
  @OnEvent('review.revision_published')
  async handleReviewRevisionPublished(payload: ReviewRevisionPublishedPayload) {
    this.logger.log(
      `Received review.revision_published for Review ${payload.reviewId} (Rev #${payload.revisionNumber})`,
    );

    const linkUrl = `/reviews/${payload.reviewId}`;
    const targetParticipants = (payload.participantUserIds || []).filter(
      userId => userId !== payload.moderatorId,
    );

    for (const participantId of targetParticipants) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: participantId,
            type: 'REVIEW_REVISION_PUBLISHED',
            title: `New Revision Published: ${payload.reviewName}`,
            content: `Revision #${payload.revisionNumber} of "${payload.reviewName}" has been published with updates.`,
            linkUrl,
            isRead: false,
          },
        });

        await this.emailQueue.add('send-revision-published-email', {
          reviewId: payload.reviewId,
          reviewName: payload.reviewName,
          revisionNumber: payload.revisionNumber,
          participantUserId: participantId,
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to process revision published notification for user ${participantId}: ${err.message}`,
          err.stack,
        );
      }
    }
  }
}
