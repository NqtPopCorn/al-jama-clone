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

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

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

    // 1. Create In-App Notification in DB (AC-06)
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

    // 2. Queue Email Job in BullMQ
    try {
      await this.emailQueue.add('send-mention-email', payload);
    } catch (err: any) {
      this.logger.error(`Failed to queue email notification: ${err.message}`, err.stack);
    }
  }
}
