import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEventListener } from './notification-event.listener';
import { PrismaService } from '../../../prisma/prisma.service';

describe('NotificationEventListener (AC-06 - In-App Notification & Email Queue)', () => {
  let listener: NotificationEventListener;
  let prisma: any;
  let emailQueue: any;

  const payload = {
    mentionedUserId: '22222222-2222-2222-2222-222222222222',
    commentId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    authorId: '11111111-1111-1111-1111-111111111111',
    authorName: 'Alex Lead',
    itemId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    itemName: 'Patient Monitoring Requirement',
    projectId: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
    projectName: 'Medical Device MVP',
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
      },
      review: {
        findUnique: jest.fn(),
      },
    };

    emailQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEventListener,
        { provide: PrismaService, useValue: prisma },
        { provide: 'BullQueue_email', useValue: emailQueue },
      ],
    }).compile();

    listener = module.get<NotificationEventListener>(NotificationEventListener);
  });

  describe('comment.mentioned', () => {
    it('should create in-app notification in database and enqueue email job', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      emailQueue.add.mockResolvedValue({});

      await listener.handleCommentMentionedEvent(payload);

      // Verify DB insert for in-app notification (AC-06)
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: payload.mentionedUserId,
          type: 'COMMENT_MENTION',
          title: 'You were mentioned in a comment',
          content: 'Alex Lead mentioned you on Patient Monitoring Requirement',
          linkUrl: `/items/${payload.itemId}`,
          isRead: false,
        },
      });

      // Verify BullMQ job enqueue
      expect(emailQueue.add).toHaveBeenCalledWith('send-mention-email', payload);
    });

    it('should fall back to project link when itemId is not provided', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'notif-2' });
      emailQueue.add.mockResolvedValue({});

      await listener.handleCommentMentionedEvent({
        mentionedUserId: payload.mentionedUserId,
        commentId: payload.commentId,
        authorId: payload.authorId,
        authorName: 'Bob',
        projectId: payload.projectId,
        projectName: 'Alpha Project',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: payload.mentionedUserId,
          type: 'COMMENT_MENTION',
          title: 'You were mentioned in a comment',
          content: 'Bob mentioned you on Alpha Project',
          linkUrl: `/projects/${payload.projectId}`,
          isRead: false,
        },
      });
    });

    it('should handle database errors gracefully without throwing', async () => {
      prisma.notification.create.mockRejectedValue(new Error('DB Connection Lost'));
      emailQueue.add.mockResolvedValue({});

      await expect(listener.handleCommentMentionedEvent(payload)).resolves.not.toThrow();
    });

    it('should handle queue errors gracefully without throwing', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      emailQueue.add.mockRejectedValue(new Error('Redis Timeout'));

      await expect(listener.handleCommentMentionedEvent(payload)).resolves.not.toThrow();
    });
  });

  describe('review.initiated', () => {
    it('should send invitations to all participants excluding the moderator', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'notif-rev' });
      emailQueue.add.mockResolvedValue({});

      await listener.handleReviewInitiated({
        reviewId: 'rev-1',
        reviewName: 'SRS Phase 2 Review',
        projectId: 'p-1',
        moderatorId: 'mod-1',
        moderatorName: 'Sarah Mod',
        revisionNumber: 1,
        participantUserIds: ['mod-1', 'user-2', 'user-3'],
        deadline: new Date('2026-10-01'),
      });

      // Should invite user-2 and user-3, but NOT mod-1
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      expect(emailQueue.add).toHaveBeenCalledTimes(2);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-2',
          type: 'REVIEW_INVITATION',
          linkUrl: '/reviews/rev-1',
        }),
      });
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-review-invitation-email',
        expect.objectContaining({
          reviewId: 'rev-1',
          participantUserId: 'user-2',
        }),
      );
    });
  });

  describe('review.participant_added', () => {
    it('should send invitation to the newly added participant', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'notif-added' });
      emailQueue.add.mockResolvedValue({});

      await listener.handleReviewParticipantAdded({
        reviewId: 'rev-1',
        reviewName: 'SRS Review',
        addedByUserId: 'mod-1',
        participantUserId: 'user-4',
        reviewRole: 'REVIEWER',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-4',
          type: 'REVIEW_INVITATION',
          linkUrl: '/reviews/rev-1',
        }),
      });
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-review-invitation-email',
        expect.objectContaining({
          reviewId: 'rev-1',
          participantUserId: 'user-4',
        }),
      );
    });
  });

  describe('review.comment_mentioned', () => {
    it('should notify mentioned users in review comment', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'notif-mention' });
      emailQueue.add.mockResolvedValue({});

      await listener.handleReviewCommentMentioned({
        reviewId: 'rev-1',
        reviewItemId: 'item-10',
        commentId: 'c-1',
        mentionedUserIds: ['user-5'],
        authorId: 'user-6',
        authorName: 'Commenter',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-5',
          type: 'REVIEW_COMMENT_MENTION',
          linkUrl: '/reviews/rev-1?reviewItemId=item-10',
        }),
      });
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-review-mention-email',
        expect.objectContaining({
          reviewId: 'rev-1',
          mentionedUserId: 'user-5',
        }),
      );
    });
  });

  describe('review.participant_finished', () => {
    it('should notify the review moderator when a participant completes review', async () => {
      prisma.review.findUnique.mockResolvedValue({
        createdBy: 'mod-1',
        name: 'SRS Review',
        participants: [{ userId: 'mod-1' }],
      });
      prisma.notification.create.mockResolvedValue({ id: 'notif-finished' });
      emailQueue.add.mockResolvedValue({});

      await listener.handleReviewParticipantFinished({
        reviewId: 'rev-1',
        userId: 'user-2',
        userName: 'Alex Reviewer',
        reviewRole: 'APPROVER',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'mod-1',
          type: 'REVIEW_PARTICIPANT_FINISHED',
          linkUrl: '/reviews/rev-1',
        }),
      });
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-participant-finished-email',
        expect.objectContaining({
          reviewId: 'rev-1',
          moderatorId: 'mod-1',
          participantUserId: 'user-2',
        }),
      );
    });
  });
});
