import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AuditEventListener } from './listeners/audit-event.listener';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditModule (AuditService & AuditEventListener)', () => {
  let auditService: AuditService;
  let auditListener: AuditEventListener;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, AuditEventListener, { provide: PrismaService, useValue: prisma }],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
    auditListener = module.get<AuditEventListener>(AuditEventListener);
  });

  describe('AuditService', () => {
    it('should create audit log successfully', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await auditService.createLog({
        userId: 'user-1',
        entityType: 'REVIEW_ITEM_STATUS',
        entityId: 'item-1',
        action: 'APPROVE',
        newData: { status: 'APPROVED' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          entityType: 'REVIEW_ITEM_STATUS',
          entityId: 'item-1',
          action: 'APPROVE',
          oldData: undefined,
          newData: { status: 'APPROVED' },
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
      expect(result).toEqual({ id: 'audit-1' });
    });

    it('should query audit logs with pagination', async () => {
      prisma.auditLog.findMany.mockResolvedValue([{ id: 'audit-1' }]);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await auditService.findLogs({
        entityType: 'REVIEW_ITEM_STATUS',
        page: 1,
        limit: 10,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
      expect(prisma.auditLog.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('AuditEventListener', () => {
    it('should record audit log on review.item_status_changed (APPROVE/REJECT)', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-status' });

      await auditListener.handleItemStatusChanged({
        reviewId: 'review-1',
        reviewItemId: 'rev-item-1',
        userId: 'user-1',
        userRole: 'APPROVER',
        status: 'APPROVED',
        revisionNumber: 1,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          entityType: 'REVIEW_ITEM_STATUS',
          entityId: 'rev-item-1',
          action: 'APPROVED',
          newData: expect.objectContaining({
            reviewId: 'review-1',
            status: 'APPROVED',
          }),
        }),
      });
    });

    it('should record audit log on review.participant_finished (COMPLETE_REVIEW)', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-complete' });

      await auditListener.handleParticipantFinished({
        reviewId: 'review-1',
        userId: 'user-2',
        reviewRole: 'REVIEWER',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-2',
          entityType: 'REVIEW_PARTICIPANT',
          entityId: 'review-1',
          action: 'COMPLETE_REVIEW',
        }),
      });
    });

    it('should record audit log on review.initiated', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-initiate' });

      await auditListener.handleReviewInitiated({
        reviewId: 'review-1',
        reviewName: 'Alpha Review',
        projectId: 'project-1',
        moderatorId: 'mod-1',
        revisionNumber: 1,
        participantUserIds: ['user-1', 'user-2'],
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'mod-1',
          entityType: 'REVIEW',
          entityId: 'review-1',
          action: 'INITIATE_REVIEW',
        }),
      });
    });
  });
});
