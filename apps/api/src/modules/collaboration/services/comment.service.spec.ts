import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScopeType, MentionedType } from '@prisma/client';
import { CommentService } from './comment.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CommentService (Epic E4 - Collaboration)', () => {
  let service: CommentService;
  let prisma: any;
  let eventEmitter: any;

  const authorId = '11111111-1111-1111-1111-111111111111';
  const mentionedUserId = '22222222-2222-2222-2222-222222222222';
  const itemId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const projectId = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
  const commentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeEach(async () => {
    prisma = {
      item: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      comment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      commentMention: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  describe('create (Item comment & @mention parsing)', () => {
    it('should throw NotFoundException if item does not exist', async () => {
      prisma.item.findUnique.mockResolvedValue(null);

      await expect(service.create(itemId, { content: 'Test comment' }, authorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create comment, resolve mentions from @username, ignore self-mentions, and emit events', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        name: 'Requirement Item 1',
        projectId,
        project: { id: projectId, name: 'Medical System' },
      });

      prisma.user.findUnique.mockResolvedValue({
        id: authorId,
        fullName: 'Alex Author',
      });

      // User search for @member
      prisma.user.findMany.mockImplementation((args: any) => {
        if (args.where?.username) {
          return [{ id: mentionedUserId }];
        }
        if (args.where?.id) {
          return [{ id: mentionedUserId }];
        }
        return [];
      });

      prisma.comment.create.mockResolvedValue({
        id: commentId,
        content: 'Hello @member and @authorSelf',
        authorId,
        scopeType: ScopeType.ITEM,
        scopeId: itemId,
      });

      const mockCommentWithAuthor = {
        id: commentId,
        content: 'Hello @member and @authorSelf',
        author: { id: authorId, fullName: 'Alex Author', avatarUrl: null },
        mentions: [{ id: 'm-1', mentionedId: mentionedUserId }],
        parent: null,
      };
      prisma.comment.findUnique.mockResolvedValue(mockCommentWithAuthor);

      const result = await service.create(
        itemId,
        { content: 'Hello @member and @authorSelf' },
        authorId,
      );

      expect(result).toEqual(mockCommentWithAuthor);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Hello @member and @authorSelf',
          authorId,
          scopeType: ScopeType.ITEM,
          scopeId: itemId,
          parentCommentId: undefined,
        },
      });

      // commentMention created for mentionedUserId, excluding self
      expect(prisma.commentMention.createMany).toHaveBeenCalledWith({
        data: [
          {
            commentId,
            mentionedType: MentionedType.USER,
            mentionedId: mentionedUserId,
          },
        ],
      });

      // Emitted events
      expect(eventEmitter.emit).toHaveBeenCalledWith('comment.created', {
        commentId,
        itemId,
        projectId,
        authorId,
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith('comment.mentioned', {
        mentionedUserId,
        commentId,
        authorId,
        authorName: 'Alex Author',
        itemId,
        itemName: 'Requirement Item 1',
        projectId,
        projectName: 'Medical System',
      });
    });

    it('should support explicit mentionedUserIds from DTO', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        name: 'Item 2',
        projectId,
        project: { id: projectId, name: 'Medical System' },
      });
      prisma.user.findUnique.mockResolvedValue({ id: authorId, fullName: 'Alex' });
      prisma.user.findMany.mockResolvedValue([{ id: mentionedUserId }]);
      prisma.comment.create.mockResolvedValue({ id: commentId });
      prisma.comment.findUnique.mockResolvedValue({ id: commentId });

      await service.create(
        itemId,
        { content: 'Please review', mentionedUserIds: [mentionedUserId] },
        authorId,
      );

      expect(prisma.commentMention.createMany).toHaveBeenCalledWith({
        data: [
          {
            commentId,
            mentionedType: MentionedType.USER,
            mentionedId: mentionedUserId,
          },
        ],
      });
    });
  });

  describe('createForProject (Project Stream)', () => {
    it('should throw NotFoundException if project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.createForProject(projectId, { content: 'Project update' }, authorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create comment with PROJECT scope and emit events', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: projectId,
        name: 'Alpha Project',
      });
      prisma.user.findUnique.mockResolvedValue({ id: authorId, fullName: 'Lead Dev' });
      prisma.comment.create.mockResolvedValue({ id: commentId });
      prisma.comment.findUnique.mockResolvedValue({ id: commentId });

      await service.createForProject(projectId, { content: 'Sprint kickoff message' }, authorId);

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Sprint kickoff message',
          authorId,
          scopeType: ScopeType.PROJECT,
          scopeId: projectId,
          parentCommentId: undefined,
        },
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith('comment.created', {
        commentId,
        projectId,
        authorId,
      });
    });
  });

  describe('findByItem', () => {
    it('should return comments ordered by createdAt asc', async () => {
      const mockComments = [
        { id: 'c1', content: 'First' },
        { id: 'c2', content: 'Second' },
      ];
      prisma.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.findByItem(itemId);

      expect(result).toEqual(mockComments);
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            scopeType: ScopeType.ITEM,
            scopeId: itemId,
            isDeleted: false,
          },
          orderBy: { createdAt: 'asc' },
        }),
      );
    });
  });

  describe('findByProject', () => {
    it('should return combined comments for project and its items', async () => {
      prisma.item.findMany.mockResolvedValue([
        { id: itemId, name: 'Item Alpha', itemKey: 'MED-REQ-001' },
      ]);

      const mockComments = [
        {
          id: 'c1',
          content: 'Project general comment',
          scopeType: ScopeType.PROJECT,
          scopeId: projectId,
        },
        {
          id: 'c2',
          content: 'Comment on item alpha',
          scopeType: ScopeType.ITEM,
          scopeId: itemId,
        },
      ];
      prisma.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.findByProject(projectId);

      expect(result).toHaveLength(2);
      expect(result[0].item).toBeNull();
      expect(result[1].item).toEqual({
        id: itemId,
        name: 'Item Alpha',
        itemKey: 'MED-REQ-001',
      });
    });
  });
});
