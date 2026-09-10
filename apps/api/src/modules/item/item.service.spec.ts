import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectRole } from '@prisma/client';
import { ItemService } from './item.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectService } from '../project/project.service';

describe('ItemService - Item Locking (AC-01 / QT-01)', () => {
  let service: ItemService;
  let prisma: any;
  let eventEmitter: any;

  const userA = '11111111-1111-1111-1111-111111111111';
  const userB = '22222222-2222-2222-2222-222222222222';
  const adminUser = '33333333-3333-3333-3333-333333333333';
  const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const itemId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(async () => {
    prisma = {
      item: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      projectMember: {
        findUnique: jest.fn(),
      },
      itemVersion: {
        create: jest.fn(),
      },
      itemActivityLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback: any) => callback(prisma)),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectService, useValue: {} },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
  });

  describe('lockItem (AC-01)', () => {
    it('should successfully lock an unlocked item', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: null,
        lockedAt: null,
        isDeleted: false,
      });
      prisma.item.update.mockResolvedValue({
        id: itemId,
        lockedBy: userA,
        lockedAt: expect.any(Date),
      });

      const result = await service.lockItem(itemId, userA);

      expect(result.success).toBe(true);
      expect(result.lockedBy).toBe(userA);
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: {
          lockedBy: userA,
          lockedAt: expect.any(Date),
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'item.locked',
        expect.objectContaining({ itemId, actorId: userA }),
      );
    });

    it('should allow the same user to refresh their active lock', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: userA,
        lockedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        isDeleted: false,
      });
      prisma.item.update.mockResolvedValue({
        id: itemId,
        lockedBy: userA,
        lockedAt: expect.any(Date),
      });

      const result = await service.lockItem(itemId, userA);

      expect(result.success).toBe(true);
      expect(result.lockedBy).toBe(userA);
      expect(prisma.item.update).toHaveBeenCalled();
    });

    it('should throw ConflictException if item is actively locked by another user (< 15 mins)', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: userA,
        lockedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        locker: { id: userA, fullName: 'User A' },
        isDeleted: false,
      });

      await expect(service.lockItem(itemId, userB)).rejects.toThrow(ConflictException);
      expect(prisma.item.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should allow locking if previous lock by another user has expired (> 15 mins)', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: userA,
        lockedAt: new Date(Date.now() - 16 * 60 * 1000), // 16 mins ago (> 15 min timeout)
        locker: { id: userA, fullName: 'User A' },
        isDeleted: false,
      });
      prisma.item.update.mockResolvedValue({
        id: itemId,
        lockedBy: userB,
        lockedAt: expect.any(Date),
      });

      const result = await service.lockItem(itemId, userB);

      expect(result.success).toBe(true);
      expect(result.lockedBy).toBe(userB);
      expect(prisma.item.update).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'item.locked',
        expect.objectContaining({ itemId, actorId: userB }),
      );
    });

    it('should throw NotFoundException if item does not exist', async () => {
      prisma.item.findUnique.mockResolvedValue(null);

      await expect(service.lockItem(itemId, userA)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if item is soft-deleted', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        isDeleted: true,
      });

      await expect(service.lockItem(itemId, userA)).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlockItem (AC-01 / QT-01)', () => {
    it('should allow the lock holder to unlock their item', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: userA,
        lockedAt: new Date(),
        isDeleted: false,
      });
      prisma.item.update.mockResolvedValue({
        id: itemId,
        lockedBy: null,
        lockedAt: null,
      });

      const result = await service.unlockItem(itemId, userA);

      expect(result.success).toBe(true);
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { lockedBy: null, lockedAt: null },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'item.unlocked',
        expect.objectContaining({ itemId, actorId: userA }),
      );
    });

    it('should allow a project administrator to force-unlock another user item', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: userA,
        lockedAt: new Date(),
        isDeleted: false,
      });
      prisma.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId: adminUser,
        projectRole: ProjectRole.ADMINISTRATOR,
      });
      prisma.item.update.mockResolvedValue({
        id: itemId,
        lockedBy: null,
        lockedAt: null,
      });

      const result = await service.unlockItem(itemId, adminUser);

      expect(result.success).toBe(true);
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { lockedBy: null, lockedAt: null },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'item.unlocked',
        expect.objectContaining({ itemId, actorId: adminUser }),
      );
    });

    it('should throw ForbiddenException if a non-admin user tries to unlock another user item', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: userA,
        lockedAt: new Date(),
        isDeleted: false,
      });
      prisma.projectMember.findUnique.mockResolvedValue({
        projectId,
        userId: userB,
        projectRole: ProjectRole.MEMBER,
      });

      await expect(service.unlockItem(itemId, userB)).rejects.toThrow(ForbiddenException);
      expect(prisma.item.update).not.toHaveBeenCalled();
    });

    it('should return success message if item is not locked', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: itemId,
        projectId,
        lockedBy: null,
        lockedAt: null,
        isDeleted: false,
      });

      const result = await service.unlockItem(itemId, userA);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Item was not locked');
      expect(prisma.item.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if item not found or isDeleted', async () => {
      prisma.item.findUnique.mockResolvedValue(null);

      await expect(service.unlockItem(itemId, userA)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItem with lock protection (AC-01 / QT-01)', () => {
    const baseItem = {
      id: itemId,
      projectId,
      itemKey: 'REQ-1',
      name: 'Old Name',
      description: 'Old Description',
      status: 'DRAFT',
      priority: 'MEDIUM',
      currentVersion: 1,
      folderId: null,
      assigneeId: null,
      customFields: {},
      isDeleted: false,
      itemType: { fields: [] },
      folder: null,
    };

    it('should block update and throw ConflictException if actively locked by another user', async () => {
      prisma.item.findUnique.mockResolvedValue({
        ...baseItem,
        lockedBy: userA,
        lockedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago (< 15 min)
      });

      await expect(service.updateItem(itemId, { name: 'New Name' }, userB)).rejects.toThrow(
        ConflictException,
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should allow update if item lock held by another user has expired (> 15 mins)', async () => {
      prisma.item.findUnique.mockResolvedValue({
        ...baseItem,
        lockedBy: userA,
        lockedAt: new Date(Date.now() - 16 * 60 * 1000), // 16 min ago (> 15 min)
      });
      // Mock getItemDetail which is returned by updateItem
      jest.spyOn(service, 'getItemDetail').mockResolvedValue({
        id: itemId,
        name: 'New Name',
        currentVersion: 2,
      } as any);

      await service.updateItem(itemId, { name: 'New Name' }, userB);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'item.updated',
        expect.objectContaining({ itemId, actorId: userB, versionNumber: 2 }),
      );
    });

    it('should auto-unlock item on save when updated by the lock holder', async () => {
      prisma.item.findUnique.mockResolvedValue({
        ...baseItem,
        lockedBy: userA,
        lockedAt: new Date(Date.now() - 2 * 60 * 1000),
      });
      jest.spyOn(service, 'getItemDetail').mockResolvedValue({
        id: itemId,
        name: 'Updated by holder',
        currentVersion: 2,
      } as any);

      await service.updateItem(itemId, { name: 'Updated by holder' }, userA);

      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId },
          data: expect.objectContaining({
            lockedBy: null,
            lockedAt: null,
          }),
        }),
      );
    });
  });
});
