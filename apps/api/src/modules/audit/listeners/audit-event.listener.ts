import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../audit.service';

export interface ReviewItemStatusChangedPayload {
  reviewId: string;
  reviewItemId: string;
  itemId?: string;
  itemKey?: string;
  userId: string;
  userRole?: string;
  oldStatus?: string;
  status: string;
  rejectionComment?: string;
  revisionNumber: number;
}

export interface ReviewParticipantFinishedPayload {
  reviewId: string;
  userId: string;
  reviewRole: string;
}

export interface ReviewInitiatedPayload {
  reviewId: string;
  reviewName: string;
  projectId: string;
  moderatorId: string;
  revisionNumber: number;
  participantUserIds: string[];
  deadline?: Date | string | null;
}

export interface ReviewParticipantAddedPayload {
  reviewId: string;
  reviewName?: string;
  addedByUserId: string;
  participantUserId: string;
  reviewRole: string;
  deadline?: Date | string | null;
}

@Injectable()
export class AuditEventListener {
  private readonly logger = new Logger(AuditEventListener.name);

  constructor(private readonly auditService: AuditService) {}

  @OnEvent('review.item_status_changed')
  async handleItemStatusChanged(payload: ReviewItemStatusChangedPayload) {
    this.logger.log(
      `[Audit] Item status changed: User ${payload.userId} -> Item ${payload.reviewItemId} = ${payload.status}`,
    );

    await this.auditService.createLog({
      userId: payload.userId,
      entityType: 'REVIEW_ITEM_STATUS',
      entityId: payload.reviewItemId,
      action: payload.status,
      oldData: payload.oldStatus ? { status: payload.oldStatus } : undefined,
      newData: {
        reviewId: payload.reviewId,
        itemId: payload.itemId,
        itemKey: payload.itemKey,
        status: payload.status,
        userRole: payload.userRole,
        comment: payload.rejectionComment,
        revisionNumber: payload.revisionNumber,
      },
    });
  }

  @OnEvent('review.participant_finished')
  async handleParticipantFinished(payload: ReviewParticipantFinishedPayload) {
    this.logger.log(
      `[Audit] Participant finished review: User ${payload.userId} in Review ${payload.reviewId}`,
    );

    await this.auditService.createLog({
      userId: payload.userId,
      entityType: 'REVIEW_PARTICIPANT',
      entityId: payload.reviewId,
      action: 'COMPLETE_REVIEW',
      newData: {
        reviewId: payload.reviewId,
        reviewRole: payload.reviewRole,
        finishedAt: new Date().toISOString(),
      },
    });
  }

  @OnEvent('review.initiated')
  async handleReviewInitiated(payload: ReviewInitiatedPayload) {
    this.logger.log(
      `[Audit] Review initiated: Moderator ${payload.moderatorId} -> Review ${payload.reviewId} (${payload.reviewName})`,
    );

    await this.auditService.createLog({
      userId: payload.moderatorId,
      entityType: 'REVIEW',
      entityId: payload.reviewId,
      action: 'INITIATE_REVIEW',
      newData: {
        reviewName: payload.reviewName,
        projectId: payload.projectId,
        revisionNumber: payload.revisionNumber,
        participantCount: payload.participantUserIds?.length || 0,
        deadline: payload.deadline,
      },
    });
  }

  @OnEvent('review.participant_added')
  async handleParticipantAdded(payload: ReviewParticipantAddedPayload) {
    this.logger.log(
      `[Audit] Participant added: Moderator ${payload.addedByUserId} added User ${payload.participantUserId} to Review ${payload.reviewId}`,
    );

    await this.auditService.createLog({
      userId: payload.addedByUserId,
      entityType: 'REVIEW_PARTICIPANT',
      entityId: payload.reviewId,
      action: 'ADD_PARTICIPANT',
      newData: {
        participantUserId: payload.participantUserId,
        reviewRole: payload.reviewRole,
      },
    });
  }
}
