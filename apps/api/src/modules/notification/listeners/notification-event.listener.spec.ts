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
