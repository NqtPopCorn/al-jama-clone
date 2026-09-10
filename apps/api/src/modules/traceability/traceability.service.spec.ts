import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TraceabilityService } from './traceability.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectService } from '../project/project.service';

describe('TraceabilityService - Suspect Flagging (AC-02 / QT-02)', () => {
  let service: TraceabilityService;
  let prisma: any;
  let eventEmitter: any;

  const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const userId = '11111111-1111-1111-1111-111111111111';
  const upstreamItemId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const downstreamItem1 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const downstreamItem2 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const relationshipId1 = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const relationshipId2 = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const relTypeId = '99999999-9999-9999-9999-999999999999';

  beforeEach(async () => {
    prisma = {
      itemRelationship: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      relationshipType: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      item: {
        findUnique: jest.fn(),
      },
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraceabilityService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectService, useValue: {} },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<TraceabilityService>(TraceabilityService);
  });

  describe('triggerSuspectFlagForUpstreamChange (QT-02)', () => {
    it('should flag strictly 1-level downstream relationships when upstream changes', async () => {
      // Mock downstream relationships where suspectOnUpstreamChange is true and not yet suspect
      prisma.itemRelationship.findMany.mockResolvedValue([
        { id: relationshipId1, downstreamItemId: downstreamItem1 },
        { id: relationshipId2, downstreamItemId: downstreamItem2 },
      ]);
      prisma.itemRelationship.updateMany.mockResolvedValue({ count: 2 });

      const flaggedCount = await service.triggerSuspectFlagForUpstreamChange(
        upstreamItemId,
        'Item updated to version 2',
      );

      expect(flaggedCount).toBe(2);

      // Verify query strictly looks for downstream relationships where upstream is the modified item
      expect(prisma.itemRelationship.findMany).toHaveBeenCalledWith({
        where: {
          upstreamItemId,
          relationshipType: { suspectOnUpstreamChange: true },
          isSuspect: false,
        },
        select: { id: true, downstreamItemId: true },
      });

      // Verify update sets suspect flag
      expect(prisma.itemRelationship.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [relationshipId1, relationshipId2] },
        },
        data: {
          isSuspect: true,
          suspectFlaggedAt: expect.any(Date),
          suspectReason: 'Upstream item changed: Item updated to version 2',
          clearedBy: null,
          clearedAt: null,
        },
      });

      // Verify events emitted for both flagged downstream relationships
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'relationship.suspect_flagged',
        expect.objectContaining({
          relationshipId: relationshipId1,
          downstreamItemId: downstreamItem1,
          upstreamItemId,
          reason: 'Upstream item changed: Item updated to version 2',
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'relationship.suspect_flagged',
        expect.objectContaining({
          relationshipId: relationshipId2,
          downstreamItemId: downstreamItem2,
          upstreamItemId,
          reason: 'Upstream item changed: Item updated to version 2',
        }),
      );
    });

    it('should use default suspect reason if changeComment is not provided', async () => {
      prisma.itemRelationship.findMany.mockResolvedValue([
        { id: relationshipId1, downstreamItemId: downstreamItem1 },
      ]);
      prisma.itemRelationship.updateMany.mockResolvedValue({ count: 1 });

      await service.triggerSuspectFlagForUpstreamChange(upstreamItemId);

      expect(prisma.itemRelationship.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [relationshipId1] } },
        data: expect.objectContaining({
          suspectReason: 'Upstream item modified (new version published)',
        }),
      });
    });

    it('should return 0 and not emit events if no non-suspect downstream links exist', async () => {
      prisma.itemRelationship.findMany.mockResolvedValue([]);

      const count = await service.triggerSuspectFlagForUpstreamChange(upstreamItemId);

      expect(count).toBe(0);
      expect(prisma.itemRelationship.updateMany).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should return 0 for invalid upstreamItemId format', async () => {
      const count = await service.triggerSuspectFlagForUpstreamChange('invalid-uuid');

      expect(count).toBe(0);
      expect(prisma.itemRelationship.findMany).not.toHaveBeenCalled();
    });
  });

  describe('clearSuspect (AC-02 / BR-TRACE-04)', () => {
    const mockRel = {
      id: relationshipId1,
      projectId,
      upstreamItemId,
      downstreamItemId: downstreamItem1,
      isSuspect: true,
      suspectFlaggedAt: new Date(),
      suspectReason: 'Upstream item modified',
      relationshipType: {
        id: relTypeId,
        projectId,
        name: 'Verifies',
        inverseName: 'Is Verified By',
        isRequiredDefault: false,
        suspectOnUpstreamChange: true,
      },
      downstreamItem: {
        id: downstreamItem1,
        itemKey: 'TC-1',
        name: 'Test Case 1',
        itemTypeId: 'type-1',
        itemType: { key: 'TC', name: 'Test Case', icon: 'test' },
        status: 'READY',
        priority: 'HIGH',
        currentVersion: 1,
      },
      creator: { id: userId, fullName: 'Test User' },
    };

    it('should successfully clear suspect flag on a relationship', async () => {
      prisma.itemRelationship.findUnique.mockResolvedValue(mockRel);
      prisma.itemRelationship.update.mockResolvedValue({
        ...mockRel,
        isSuspect: false,
        clearedBy: userId,
        clearedAt: new Date(),
        clearer: { id: userId, fullName: 'Test User' },
        createdAt: new Date(),
      });

      const result = await service.clearSuspect(relationshipId1, userId);

      expect(result.isSuspect).toBe(false);
      expect(result.clearedBy).toEqual({ id: userId, fullName: 'Test User' });
      expect(prisma.itemRelationship.update).toHaveBeenCalledWith({
        where: { id: relationshipId1 },
        data: {
          isSuspect: false,
          clearedBy: userId,
          clearedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'relationship.suspect_cleared',
        expect.objectContaining({
          relationshipId: relationshipId1,
          downstreamItemId: downstreamItem1,
          userId,
        }),
      );
    });

    it('should throw NotFoundException if relationship does not exist', async () => {
      prisma.itemRelationship.findUnique.mockResolvedValue(null);

      await expect(service.clearSuspect(relationshipId1, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for invalid relationship UUID', async () => {
      await expect(service.clearSuspect('invalid-uuid', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clearAllSuspectsForItem', () => {
    it('should clear all suspect flags where the item is downstream', async () => {
      prisma.itemRelationship.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.clearAllSuspectsForItem(downstreamItem1, userId);

      expect(result.clearedCount).toBe(3);
      expect(prisma.itemRelationship.updateMany).toHaveBeenCalledWith({
        where: {
          downstreamItemId: downstreamItem1,
          isSuspect: true,
        },
        data: {
          isSuspect: false,
          clearedBy: userId,
          clearedAt: expect.any(Date),
        },
      });
    });

    it('should return 0 if invalid UUID provided', async () => {
      const result = await service.clearAllSuspectsForItem('not-a-uuid', userId);
      expect(result.clearedCount).toBe(0);
      expect(prisma.itemRelationship.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('createRelationship & deleteRelationship', () => {
    it('should reject creating relationship to itself (circular)', async () => {
      await expect(
        service.createRelationship(
          projectId,
          {
            upstreamItemId,
            downstreamItemId: upstreamItemId,
            relationshipTypeId: relTypeId,
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if upstream item does not exist', async () => {
      prisma.item.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createRelationship(
          projectId,
          {
            upstreamItemId,
            downstreamItemId: downstreamItem1,
            relationshipTypeId: relTypeId,
          },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
