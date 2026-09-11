import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-mention-email': {
        const { mentionedUserId, commentId, authorId, itemId } = job.data;
        // In Milestone 2.1, we only log to console (log-only fallback) instead of actual SMTP
        this.logger.log(
          `[LOG-ONLY SMTP] Sending mention email to user ${mentionedUserId}: User ${authorId} mentioned you in comment ${commentId} on item ${itemId}`,
        );
        break;
      }
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
