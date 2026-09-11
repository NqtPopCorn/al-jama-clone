import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../../prisma/prisma.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host) {
      if (user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: Number(port) === 465,
          auth: { user, pass },
        });
        this.logger.log(
          `EmailProcessor: Configured authenticated SMTP transport for ${host}:${port}`,
        );
      } else {
        // Unauthenticated local SMTP (e.g. Mailpit on port 1025)
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: false,
          ignoreTLS: true,
        });
        this.logger.log(
          `EmailProcessor: Configured local SMTP transport for ${host}:${port} (Mailpit)`,
        );
      }
    } else {
      this.logger.log('EmailProcessor: Running in simulator mode (log-only, SMTP not configured)');
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing BullMQ email job: ${job.name} (Job ID: ${job.id})`);

    switch (job.name) {
      case 'send-mention-email': {
        const { mentionedUserId, authorName, itemName, projectName } = job.data;
        const target = itemName || projectName || 'an item';
        const subject = `You were mentioned in a comment on ${target}`;
        const text = `${authorName || 'A team member'} mentioned you in a comment on ${target}.`;
        await this.dispatchEmail(mentionedUserId, subject, text);
        break;
      }

      case 'send-review-invitation-email': {
        const { participantUserId, reviewName, deadline } = job.data;
        const deadlineInfo = deadline
          ? ` Please complete by ${new Date(deadline).toLocaleDateString()}.`
          : '';
        const subject = `Invitation to Review: ${reviewName}`;
        const text = `You have been invited to participate in the review cycle "${reviewName}".${deadlineInfo}`;
        await this.dispatchEmail(participantUserId, subject, text);
        break;
      }

      case 'send-review-mention-email': {
        const { mentionedUserId, authorName } = job.data;
        const subject = `You were mentioned in a review comment`;
        const text = `${authorName || 'A reviewer'} mentioned you in a comment within Review Center.`;
        await this.dispatchEmail(mentionedUserId, subject, text);
        break;
      }

      case 'send-participant-finished-email': {
        const { moderatorId, reviewName, reviewRole } = job.data;
        const subject = `Participant completed review: ${reviewName}`;
        const text = `A ${reviewRole?.toLowerCase() || 'participant'} has marked their review as finished on "${reviewName}".`;
        await this.dispatchEmail(moderatorId, subject, text);
        break;
      }

      case 'send-revision-published-email': {
        const { participantUserId, reviewName, revisionNumber } = job.data;
        const subject = `New Revision Published: ${reviewName}`;
        const text = `Revision #${revisionNumber} of review "${reviewName}" has been published with updates.`;
        await this.dispatchEmail(participantUserId, subject, text);
        break;
      }

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async dispatchEmail(recipientId: string, subject: string, body: string) {
    let targetEmail = recipientId;

    // Resolve real user email and name from database
    if (recipientId && recipientId.includes('-')) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: recipientId },
          select: { email: true, fullName: true },
        });
        if (user?.email) {
          targetEmail = user.fullName ? `"${user.fullName}" <${user.email}>` : user.email;
        }
      } catch {
        targetEmail = `${recipientId}@al-jama.local`;
      }
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>(
            'SMTP_FROM',
            '"AL-JAMA Notifications" <noreply@al-jama.local>',
          ),
          to: targetEmail,
          subject,
          text: body,
        });
        this.logger.log(`[SMTP] Successfully sent email to ${targetEmail}: "${subject}"`);
        return;
      } catch (err: any) {
        this.logger.error(
          `[SMTP Error] Failed to send email via SMTP: ${err.message}. Falling back to log.`,
        );
      }
    }

    // Simulator / Log-only fallback
    this.logger.log(
      `[EMAIL SIMULATOR] To: ${targetEmail} | Subject: "${subject}" | Content: "${body}"`,
    );
  }
}
