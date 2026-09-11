import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewExecutionService } from './review-execution.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReviewStatus, ReviewRole, ReviewItemStatusValue } from '@prisma/client';

describe('ReviewExecutionService (QT-04, QT-06, A-P2-02)', () => {
  let service: ReviewExecutionService;
  let prisma: any;
  let eventEmitter: any;

  const reviewId = '11111111-1111-1111-1111-111111111111';
  const reviewItemId = '22222222-2222-2222-2222-222222222222';
  const reviewerUserId = '33333333-3333-3333-3333-333333333333';
  const approverUserId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    prisma = {
      review: {
        findUnique: jest.fn(),
      },
      reviewParticipant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      reviewItemStatus: {
        upsert: jest.fn(),
        count: jest.fn(),
      },
      reviewComment: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewExecutionService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ReviewExecutionService>(ReviewExecutionService);
  });

  describe('updateItemStatus - QT-04: Reviewer ≠ Approver status set', () => {
    it('should allow Reviewer to mark item as REVIEWED', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 1,
        items: [{ id: reviewItemId }],
      });

      prisma.reviewParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        reviewId,
        userId: reviewerUserId,
        reviewRole: ReviewRole.REVIEWER,
      });

      prisma.reviewItemStatus.upsert.mockResolvedValue({
        id: 'status-1',
        status: ReviewItemStatusValue.REVIEWED,
      });

      const res = await service.updateItemStatus(reviewId, reviewItemId, reviewerUserId, {
        status: ReviewItemStatusValue.REVIEWED,
      });

      expect(res.status).toBe(ReviewItemStatusValue.REVIEWED);
      expect(prisma.reviewItemStatus.upsert).toHaveBeenCalled();
    });

    it('should FORBID Reviewer from marking item as APPROVED (QT-04)', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 1,
        items: [{ id: reviewItemId }],
      });

      prisma.reviewParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        reviewId,
        userId: reviewerUserId,
        reviewRole: ReviewRole.REVIEWER,
      });

      await expect(
        service.updateItemStatus(reviewId, reviewItemId, reviewerUserId, {
          status: ReviewItemStatusValue.APPROVED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should FORBID Reviewer from marking item as REJECTED (QT-04)', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 1,
        items: [{ id: reviewItemId }],
      });

      prisma.reviewParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        reviewId,
        userId: reviewerUserId,
        reviewRole: ReviewRole.REVIEWER,
      });

      await expect(
        service.updateItemStatus(reviewId, reviewItemId, reviewerUserId, {
          status: ReviewItemStatusValue.REJECTED,
          rejectionComment: 'Not clear',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateItemStatus - A-P2-02: Reject requires Comment', () => {
    it('should throw BadRequestException if Approver rejects without a comment', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 1,
        items: [{ id: reviewItemId }],
      });

      prisma.reviewParticipant.findUnique.mockResolvedValue({
        id: 'part-2',
        reviewId,
        userId: approverUserId,
        reviewRole: ReviewRole.APPROVER,
      });

      await expect(
        service.updateItemStatus(reviewId, reviewItemId, approverUserId, {
          status: ReviewItemStatusValue.REJECTED,
          rejectionComment: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully reject and create comment when comment is provided', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 1,
        items: [{ id: reviewItemId }],
      });

      prisma.reviewParticipant.findUnique.mockResolvedValue({
        id: 'part-2',
        reviewId,
        userId: approverUserId,
        reviewRole: ReviewRole.APPROVER,
      });

      prisma.reviewItemStatus.upsert.mockResolvedValue({
        id: 'status-2',
        status: ReviewItemStatusValue.REJECTED,
      });

      const res = await service.updateItemStatus(reviewId, reviewItemId, approverUserId, {
        status: ReviewItemStatusValue.REJECTED,
        rejectionComment: 'Missing trigger requirement',
      });

      expect(res.status).toBe(ReviewItemStatusValue.REJECTED);
      expect(prisma.reviewComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Missing trigger requirement',
            label: 'ISSUE',
          }),
        }),
      );
    });
  });

  describe('completeReview - QT-06: Reject blocks completion', () => {
    it('should throw ConflictException if user has rejected items (QT-06)', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 1,
        items: [{ id: reviewItemId }],
      });

      prisma.reviewParticipant.findUnique.mockResolvedValue({
        id: 'part-2',
        reviewId,
        userId: approverUserId,
        reviewRole: ReviewRole.APPROVER,
      });

      // 1 item rejected
      prisma.reviewItemStatus.count.mockResolvedValue(1);

      await expect(service.completeReview(reviewId, approverUserId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should mark participant as finished when no rejected items exist', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: reviewId,
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 1,
        items: [{ id: reviewItemId }],
      });

      prisma.reviewParticipant.findUnique.mockResolvedValue({
        id: 'part-2',
        reviewId,
        userId: approverUserId,
        reviewRole: ReviewRole.APPROVER,
      });

      prisma.reviewItemStatus.count.mockResolvedValue(0);
      prisma.reviewParticipant.update.mockResolvedValue({
        id: 'part-2',
        isFinished: true,
      });

      const res = await service.completeReview(reviewId, approverUserId);
      expect(res.isFinished).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'review.participant_finished',
        expect.objectContaining({ reviewId, userId: approverUserId }),
      );
    });
  });
});
