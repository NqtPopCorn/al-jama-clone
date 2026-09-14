import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewInitiationService } from './review-initiation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ReviewStatus,
  ReviewRole,
  ReviewTemplateType,
  ReviewItemStatusValue,
} from '@prisma/client';

describe('ReviewInitiationService (BR-REV-01 -> BR-REV-09, BR-REV-38)', () => {
  let service: ReviewInitiationService;
  let prisma: any;
  let eventEmitter: any;

  const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const creatorId = '11111111-1111-1111-1111-111111111111';
  const memberId1 = '22222222-2222-2222-2222-222222222222';
  const memberId2 = '33333333-3333-3333-3333-333333333333';
  const groupId = 'gggggggg-gggg-gggg-gggg-gggggggggggg';
  const itemId1 = 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii';
  const itemId2 = 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj';
  const templateId = 'tttttttt-tttt-tttt-tttt-tttttttttttt';

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      reviewTemplate: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userGroupMember: {
        findMany: jest.fn(),
      },
      item: {
        findMany: jest.fn(),
      },
      itemVersion: {
        findFirst: jest.fn(),
      },
      review: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      reviewItem: {
        createMany: jest.fn(),
        update: jest.fn(),
      },
      reviewParticipant: {
        createMany: jest.fn(),
      },
      reviewRevision: {
        create: jest.fn(),
      },
      reviewBaseline: {
        create: jest.fn(),
      },
      reviewItemStatus: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async cb => cb(prisma)),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewInitiationService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ReviewInitiationService>(ReviewInitiationService);
  });

  describe('createReview', () => {
    it('should expand group members and ensure creator is added as MODERATOR', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: projectId });
      prisma.reviewTemplate.findUnique.mockResolvedValue({ id: templateId });

      // Group has memberId1 and memberId2
      prisma.userGroupMember.findMany.mockResolvedValue([
        { userId: memberId1 },
        { userId: memberId2 },
      ]);

      prisma.item.findMany.mockResolvedValue([{ id: itemId1 }, { id: itemId2 }]);

      const createdReviewMock = {
        id: 'rev-1',
        projectId,
        name: 'Sprint Review',
        status: ReviewStatus.DRAFT,
      };
      prisma.review.create.mockResolvedValue(createdReviewMock);
      prisma.review.findUnique.mockResolvedValue(createdReviewMock);

      await service.createReview(
        {
          projectId,
          templateId,
          name: 'Sprint Review',
          itemIds: [itemId1, itemId2],
          participants: [{ groupId, reviewRole: ReviewRole.REVIEWER }],
        },
        creatorId,
      );

      // Verify participant creation expanded group and included creator
      expect(prisma.reviewParticipant.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: memberId1, reviewRole: ReviewRole.REVIEWER }),
          expect.objectContaining({ userId: memberId2, reviewRole: ReviewRole.REVIEWER }),
          expect.objectContaining({ userId: creatorId, reviewRole: ReviewRole.MODERATOR }),
        ]),
      });

      // Verify items were linked
      expect(prisma.reviewItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ itemId: itemId1, orderIndex: 1 }),
          expect.objectContaining({ itemId: itemId2, orderIndex: 2 }),
        ]),
      });
    });
  });

  describe('initiateReview - Preconditions and Auto-Baseline (BR-REV-09, BR-REV-38)', () => {
    it('should throw BadRequestException if review has 0 items', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        status: ReviewStatus.DRAFT,
        createdBy: creatorId,
        items: [],
        participants: [{ userId: creatorId, reviewRole: ReviewRole.MODERATOR }],
      });

      await expect(service.initiateReview('rev-1', creatorId)).rejects.toThrow(BadRequestException);
    });

    it('should transition review to ACTIVE, create Revision #1, snapshot baseline, and initialize statuses', async () => {
      const reviewId = 'rev-1';
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        name: 'Sprint Review',
        projectId,
        status: ReviewStatus.DRAFT,
        createdBy: creatorId,
        items: [{ id: 'ri-1', itemId: itemId1, item: { id: itemId1, currentVersion: 1 } }],
        participants: [
          { id: 'rp-1', userId: creatorId, reviewRole: ReviewRole.MODERATOR },
          { id: 'rp-2', userId: memberId1, reviewRole: ReviewRole.APPROVER },
        ],
      });

      prisma.itemVersion.findFirst.mockResolvedValue({
        id: 'ver-item-1',
        itemId: itemId1,
        versionNumber: 1,
      });

      await service.initiateReview(reviewId, creatorId, { message: 'Initiating sprint review' });

      // 1. Status transition
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: expect.objectContaining({
          status: ReviewStatus.ACTIVE,
          currentRevisionNumber: 1,
        }),
      });

      // 2. Revision creation
      expect(prisma.reviewRevision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reviewId,
          revisionNumber: 1,
          publishedBy: creatorId,
        }),
      });

      // 3. Baseline snapshot (BR-REV-38)
      expect(prisma.reviewBaseline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reviewId,
          revisionNumber: 1,
          itemVersionId: 'ver-item-1',
          triggerType: 'REVIEW_INITIATE',
        }),
      });

      // 4. Initial status rows
      expect(prisma.reviewItemStatus.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            reviewItemId: 'ri-1',
            userId: creatorId,
            status: ReviewItemStatusValue.NOT_REVIEWED,
          }),
          expect.objectContaining({
            reviewItemId: 'ri-1',
            userId: memberId1,
            status: ReviewItemStatusValue.NOT_REVIEWED,
          }),
        ]),
        skipDuplicates: true,
      });

      // 5. Event emitted
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'review.initiated',
        expect.objectContaining({
          reviewId,
          revisionNumber: 1,
        }),
      );
    });
  });
});
