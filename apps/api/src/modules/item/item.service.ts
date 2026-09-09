import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectService } from '../project/project.service';
import { QueryItemsDto } from './dto/query-items.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { BulkUpdateItemsDto } from './dto/bulk-update-items.dto';
import { ReuseItemDto } from './dto/reuse-item.dto';
import {
  ItemDetail,
  ItemSummary,
  ItemVersionDiff,
  ItemVersionSummary,
  PaginatedResult,
} from '@aljama/shared';
import { ItemActivityType, Prisma, ProjectRole } from '@prisma/client';
import { diffWordsWithSpace } from 'diff';
import {
  ItemCreatedEvent,
  ItemLockedEvent,
  ItemSubscribedEvent,
  ItemUnlockedEvent,
  ItemUpdatedEvent,
} from './events/item-events';

const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes sliding timeout for QT-01
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectService: ProjectService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private isLockActive(lockedBy?: string | null, lockedAt?: Date | null): boolean {
    if (!lockedBy || !lockedAt) return false;
    const elapsed = Date.now() - new Date(lockedAt).getTime();
    return elapsed < LOCK_TIMEOUT_MS;
  }

  async getProjectItems(
    projectId: string,
    query: QueryItemsDto,
  ): Promise<PaginatedResult<ItemSummary>> {
    const {
      page = 1,
      limit = 20,
      folderId,
      itemTypeId,
      status,
      priority,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {
      projectId,
      isDeleted: false,
    };

    if (folderId) {
      where.folderId = folderId;
    }

    if (itemTypeId) {
      where.itemTypeId = itemTypeId;
    }

    if (status) {
      where.status = { equals: status, mode: 'insensitive' };
    }

    if (priority) {
      where.priority = { equals: priority, mode: 'insensitive' };
    }

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { itemKey: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ItemOrderByWithRelationInput = { updatedAt: 'desc' };
    if (sortBy === 'itemKey') {
      orderBy = { itemKey: sortOrder };
    } else if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    } else if (sortBy === 'priority') {
      orderBy = { priority: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { updatedAt: sortOrder };
    }

    const [total, items] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          itemType: {
            select: { key: true, name: true, icon: true },
          },
          assignee: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          locker: {
            select: { id: true, fullName: true },
          },
        },
      }),
    ]);

    const mappedItems: ItemSummary[] = items.map(item => {
      const activeLock = this.isLockActive(item.lockedBy, item.lockedAt);
      return {
        id: item.id,
        projectId: item.projectId,
        folderId: item.folderId,
        itemTypeId: item.itemTypeId,
        itemTypeKey: item.itemType.key,
        itemTypeName: item.itemType.name,
        itemTypeIcon: item.itemType.icon,
        itemKey: item.itemKey,
        name: item.name,
        description: item.description,
        status: item.status,
        priority: item.priority,
        assignee: item.assignee
          ? {
              id: item.assignee.id,
              fullName: item.assignee.fullName,
              avatarUrl: item.assignee.avatarUrl,
            }
          : null,
        currentVersion: item.currentVersion,
        isLocked: activeLock,
        lockedBy:
          activeLock && item.locker
            ? {
                id: item.locker.id,
                fullName: item.locker.fullName,
              }
            : null,
        lockedAt: activeLock && item.lockedAt ? item.lockedAt.toISOString() : null,
        customFields: (item.customFields as Record<string, unknown>) || null,
        updatedAt: item.updatedAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
      };
    });

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReadingView(projectId: string, folderId?: string) {
    const where: Prisma.ItemWhereInput = {
      projectId,
      isDeleted: false,
    };

    if (folderId) {
      where.folderId = folderId;
    }

    const items = await this.prisma.item.findMany({
      where,
      orderBy: [{ folder: { orderIndex: 'asc' } }, { itemKey: 'asc' }],
      include: {
        itemType: {
          select: { key: true, name: true, icon: true },
        },
        folder: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return items.map(item => ({
      id: item.id,
      itemKey: item.itemKey,
      name: item.name,
      description: item.description,
      status: item.status,
      priority: item.priority,
      folder: item.folder ? { id: item.folder.id, name: item.folder.name } : null,
      itemType: {
        key: item.itemType.key,
        name: item.itemType.name,
        icon: item.itemType.icon,
      },
      assignee: item.assignee
        ? {
            id: item.assignee.id,
            fullName: item.assignee.fullName,
            avatarUrl: item.assignee.avatarUrl,
          }
        : null,
      customFields: (item.customFields as Record<string, unknown>) || null,
      currentVersion: item.currentVersion,
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  async getItemById(id: string): Promise<ItemSummary> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        itemType: {
          select: { key: true, name: true, icon: true },
        },
        assignee: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        locker: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundException('Item not found');
    }

    const activeLock = this.isLockActive(item.lockedBy, item.lockedAt);

    return {
      id: item.id,
      projectId: item.projectId,
      folderId: item.folderId,
      itemTypeId: item.itemTypeId,
      itemTypeKey: item.itemType.key,
      itemTypeName: item.itemType.name,
      itemTypeIcon: item.itemType.icon,
      itemKey: item.itemKey,
      name: item.name,
      description: item.description,
      status: item.status,
      priority: item.priority,
      assignee: item.assignee
        ? {
            id: item.assignee.id,
            fullName: item.assignee.fullName,
            avatarUrl: item.assignee.avatarUrl,
          }
        : null,
      currentVersion: item.currentVersion,
      isLocked: activeLock,
      lockedBy:
        activeLock && item.locker
          ? {
              id: item.locker.id,
              fullName: item.locker.fullName,
            }
          : null,
      lockedAt: activeLock && item.lockedAt ? item.lockedAt.toISOString() : null,
      customFields: (item.customFields as Record<string, unknown>) || null,
      updatedAt: item.updatedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }

  async getItemDetail(id: string, userId: string): Promise<ItemDetail> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }

    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        itemType: {
          select: { key: true, name: true, icon: true },
        },
        folder: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        locker: {
          select: { id: true, fullName: true },
        },
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        updater: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: {
            versions: true,
            subscriptions: true,
            upstreamRelationships: true,
            downstreamRelationships: true,
          },
        },
      },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundException('Item not found');
    }

    const activeLock = this.isLockActive(item.lockedBy, item.lockedAt);

    // Check if user is subscribed
    const userSub = await this.prisma.itemSubscription.findUnique({
      where: {
        itemId_userId: { itemId: id, userId },
      },
    });

    // Count unique connected users in activity log
    const connectedUsers = await this.prisma.itemActivityLog.findMany({
      where: { itemId: id },
      distinct: ['userId'],
      select: { userId: true },
    });

    // Count comments for this item
    const commentsCount = await this.prisma.comment.count({
      where: {
        scopeType: 'ITEM',
        scopeId: id,
        isDeleted: false,
      },
    });

    const relationshipsCount =
      item._count.upstreamRelationships + item._count.downstreamRelationships;

    return {
      id: item.id,
      projectId: item.projectId,
      folderId: item.folderId,
      folder: item.folder ? { id: item.folder.id, name: item.folder.name } : null,
      itemTypeId: item.itemTypeId,
      itemTypeKey: item.itemType.key,
      itemTypeName: item.itemType.name,
      itemTypeIcon: item.itemType.icon,
      itemKey: item.itemKey,
      name: item.name,
      description: item.description,
      status: item.status,
      priority: item.priority,
      assignee: item.assignee
        ? {
            id: item.assignee.id,
            fullName: item.assignee.fullName,
            avatarUrl: item.assignee.avatarUrl,
          }
        : null,
      currentVersion: item.currentVersion,
      isLocked: activeLock,
      lockedBy:
        activeLock && item.locker
          ? {
              id: item.locker.id,
              fullName: item.locker.fullName,
            }
          : null,
      lockedAt: activeLock && item.lockedAt ? item.lockedAt.toISOString() : null,
      customFields: (item.customFields as Record<string, unknown>) || null,
      creator: item.creator,
      updater: item.updater,
      versionsCount: item._count.versions,
      isSubscribed: !!userSub,
      subscriptionsCount: item._count.subscriptions,
      connectedUsersCount: connectedUsers.length || 1,
      commentsCount,
      relationshipsCount,
      updatedAt: item.updatedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }

  async createItem(projectId: string, dto: CreateItemDto, userId: string): Promise<ItemDetail> {
    // 1. Verify Project
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    // 2. Verify ItemType
    const itemType = await this.prisma.itemType.findFirst({
      where: { id: dto.itemTypeId, projectId },
      include: {
        fields: true,
      },
    });
    if (!itemType) throw new NotFoundException('Item type not found in this project');

    // 3. Verify Folder if provided
    if (dto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: dto.folderId, projectId },
      });
      if (!folder) throw new BadRequestException('Target folder does not belong to this project');
    }

    // 4. Validate Required Custom Fields
    if (itemType.fields && itemType.fields.length > 0) {
      const customFields = dto.customFields || {};
      for (const field of itemType.fields) {
        if (field.isRequired) {
          const val = customFields[field.fieldKey];
          if (val === undefined || val === null || val === '') {
            throw new BadRequestException(`Field "${field.fieldLabel}" is required`);
          }
        }
      }
    }

    // 5. Generate sequential item key: [PROJECT_KEY]-[TYPE_KEY]-[NUMBER] (e.g. MED-REQ-004)
    const prefix = `${project.key}-${itemType.key}-`;
    const lastItemWithKey = await this.prisma.item.findFirst({
      where: {
        projectId,
        itemKey: { startsWith: prefix },
      },
      orderBy: { itemKey: 'desc' },
      select: { itemKey: true },
    });

    let seqNumber = 1;
    if (lastItemWithKey) {
      const parts = lastItemWithKey.itemKey.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        seqNumber = lastNum + 1;
      }
    }

    let generatedKey = `${prefix}${String(seqNumber).padStart(3, '0')}`;
    // Fallback collision check
    let collision = await this.prisma.item.findUnique({ where: { itemKey: generatedKey } });
    while (collision) {
      seqNumber += 1;
      generatedKey = `${prefix}${String(seqNumber).padStart(3, '0')}`;
      collision = await this.prisma.item.findUnique({ where: { itemKey: generatedKey } });
    }

    const initialSnapshot = {
      itemKey: generatedKey,
      name: dto.name,
      description: dto.description || null,
      status: dto.status || 'Draft',
      priority: dto.priority || 'Medium',
      assigneeId: dto.assigneeId || null,
      folderId: dto.folderId || null,
      customFields: dto.customFields || {},
    };

    // 6. Transaction: Create item + version 1 snapshot + activity log
    const createdItem = await this.prisma.$transaction(async tx => {
      const item = await tx.item.create({
        data: {
          projectId,
          folderId: dto.folderId || null,
          itemTypeId: dto.itemTypeId,
          itemKey: generatedKey,
          name: dto.name,
          description: dto.description || null,
          status: dto.status || 'Draft',
          priority: dto.priority || 'Medium',
          assigneeId: dto.assigneeId || null,
          customFields: (dto.customFields as Prisma.InputJsonValue) || {},
          currentVersion: 1,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.itemVersion.create({
        data: {
          itemId: item.id,
          versionNumber: 1,
          snapshot: initialSnapshot as Prisma.InputJsonValue,
          changeComment: 'Initial creation',
          changedBy: userId,
        },
      });

      await tx.itemActivityLog.create({
        data: {
          itemId: item.id,
          userId,
          activityType: ItemActivityType.CREATED,
          details: {
            itemKey: generatedKey,
            name: dto.name,
          },
        },
      });

      return item;
    });

    // 7. Emit side-effect event
    this.eventEmitter.emit(
      'item.created',
      new ItemCreatedEvent(createdItem.id, projectId, userId, createdItem.itemKey),
    );

    return this.getItemDetail(createdItem.id, userId);
  }

  async updateItem(id: string, dto: UpdateItemDto, userId: string): Promise<ItemDetail> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        itemType: {
          include: { fields: true },
        },
        folder: true,
      },
    });

    if (!item || item.isDeleted) throw new NotFoundException('Item not found');

    // Concurrency Locking Check (QT-01)
    if (item.lockedBy && item.lockedBy !== userId) {
      if (this.isLockActive(item.lockedBy, item.lockedAt)) {
        throw new ConflictException('Item is currently locked by another user. Cannot overwrite.');
      }
    }

    // Check folder validity if changed
    if (dto.folderId !== undefined && dto.folderId !== null && dto.folderId !== item.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: dto.folderId, projectId: item.projectId },
      });
      if (!folder) throw new BadRequestException('Target folder does not exist in this project');
    }

    // Merge custom fields
    let mergedCustomFields: Record<string, unknown> =
      (item.customFields as Record<string, unknown>) || {};
    if (dto.customFields) {
      mergedCustomFields = { ...mergedCustomFields, ...dto.customFields };
      // Check required fields
      for (const field of item.itemType.fields) {
        if (field.isRequired) {
          const val = mergedCustomFields[field.fieldKey];
          if (val === undefined || val === null || val === '') {
            throw new BadRequestException(`Field "${field.fieldLabel}" is required`);
          }
        }
      }
    }

    const nextVersionNumber = item.currentVersion + 1;

    const newSnapshot = {
      itemKey: item.itemKey,
      name: dto.name ?? item.name,
      description: dto.description !== undefined ? dto.description : item.description,
      status: dto.status ?? item.status,
      priority: dto.priority ?? item.priority,
      assigneeId: dto.assigneeId !== undefined ? dto.assigneeId : item.assigneeId,
      folderId: dto.folderId !== undefined ? dto.folderId : item.folderId,
      customFields: mergedCustomFields,
    };

    // Transaction: update item, create version snapshot, log activity
    await this.prisma.$transaction(async tx => {
      await tx.item.update({
        where: { id },
        data: {
          name: dto.name ?? item.name,
          folderId: dto.folderId !== undefined ? dto.folderId : item.folderId,
          description: dto.description !== undefined ? dto.description : item.description,
          status: dto.status ?? item.status,
          priority: dto.priority ?? item.priority,
          assigneeId: dto.assigneeId !== undefined ? dto.assigneeId : item.assigneeId,
          customFields: mergedCustomFields as Prisma.InputJsonValue,
          currentVersion: nextVersionNumber,
          updatedBy: userId,
          // If locked by the updater, unlock on save
          lockedBy: item.lockedBy === userId ? null : item.lockedBy,
          lockedAt: item.lockedBy === userId ? null : item.lockedAt,
        },
      });

      await tx.itemVersion.create({
        data: {
          itemId: id,
          versionNumber: nextVersionNumber,
          snapshot: newSnapshot as Prisma.InputJsonValue,
          changeComment: dto.changeComment || 'Updated item details',
          changedBy: userId,
        },
      });

      await tx.itemActivityLog.create({
        data: {
          itemId: id,
          userId,
          activityType: ItemActivityType.EDITED,
          details: {
            versionNumber: nextVersionNumber,
            changeComment: dto.changeComment || null,
          },
        },
      });
    });

    this.eventEmitter.emit(
      'item.updated',
      new ItemUpdatedEvent(id, item.projectId, userId, nextVersionNumber),
    );

    return this.getItemDetail(id, userId);
  }

  async lockItem(id: string, userId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        locker: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!item || item.isDeleted) throw new NotFoundException('Item not found');

    if (item.lockedBy && item.lockedBy !== userId) {
      if (this.isLockActive(item.lockedBy, item.lockedAt)) {
        throw new ConflictException({
          message: `Item is already locked by ${item.locker?.fullName || 'another user'}`,
          lockedBy: item.locker,
          lockedAt: item.lockedAt,
        });
      }
    }

    const lockedAt = new Date();
    await this.prisma.item.update({
      where: { id },
      data: {
        lockedBy: userId,
        lockedAt,
      },
    });

    this.eventEmitter.emit('item.locked', new ItemLockedEvent(id, userId));

    return {
      success: true,
      lockedBy: userId,
      lockedAt: lockedAt.toISOString(),
    };
  }

  async unlockItem(id: string, userId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item || item.isDeleted) throw new NotFoundException('Item not found');

    if (!item.lockedBy) {
      return { success: true, message: 'Item was not locked' };
    }

    // Only locker or project administrator can unlock (QT-01)
    if (item.lockedBy !== userId) {
      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: item.projectId, userId },
        },
      });

      if (!member || member.projectRole !== ProjectRole.ADMINISTRATOR) {
        throw new ForbiddenException(
          'Only the lock holder or a project administrator can unlock this item',
        );
      }
    }

    await this.prisma.item.update({
      where: { id },
      data: {
        lockedBy: null,
        lockedAt: null,
      },
    });

    this.eventEmitter.emit('item.unlocked', new ItemUnlockedEvent(id, userId));

    return { success: true };
  }

  async getItemVersions(id: string): Promise<ItemVersionSummary[]> {
    if (!UUID_REGEX.test(id)) {
      return [];
    }

    const versions = await this.prisma.itemVersion.findMany({
      where: { itemId: id },
      orderBy: { versionNumber: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return versions.map(v => ({
      id: v.id,
      itemId: v.itemId,
      versionNumber: v.versionNumber,
      snapshot: (v.snapshot as Record<string, unknown>) || {},
      changeDetails: v.versionNumber === 1 ? 'Initial creation' : '"Description" or fields updated',
      changeComment: v.changeComment,
      changedBy: {
        id: v.user.id,
        fullName: v.user.fullName,
        avatarUrl: v.user.avatarUrl,
      },
      changedAt: v.changedAt.toISOString(),
    }));
  }

  async compareVersions(id: string, v1: number, v2: number): Promise<ItemVersionDiff> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Item with ID "${id}" not found`);
    }

    const [verA, verB] = await Promise.all([
      this.prisma.itemVersion.findUnique({
        where: { itemId_versionNumber: { itemId: id, versionNumber: v1 } },
      }),
      this.prisma.itemVersion.findUnique({
        where: { itemId_versionNumber: { itemId: id, versionNumber: v2 } },
      }),
    ]);

    if (!verA || !verB) {
      throw new NotFoundException('One or both versions not found for comparison');
    }

    const snapA = (verA.snapshot as Record<string, unknown>) || {};
    const snapB = (verB.snapshot as Record<string, unknown>) || {};

    const nameOld = String(snapA.name || '');
    const nameNew = String(snapB.name || '');

    const descOld = String(snapA.description || '');
    const descNew = String(snapB.description || '');

    // Generate word-level diff for description
    const diffTokens = diffWordsWithSpace(descOld, descNew);
    let descriptionDiffHtml = '';
    for (const token of diffTokens) {
      if (token.added) {
        descriptionDiffHtml += `<ins class="greenline bg-emerald-100 text-emerald-800 font-medium px-0.5 rounded">${token.value}</ins>`;
      } else if (token.removed) {
        descriptionDiffHtml += `<del class="redline line-through bg-red-100 text-red-700 px-0.5 rounded">${token.value}</del>`;
      } else {
        descriptionDiffHtml += token.value;
      }
    }

    const fieldDiffs: ItemVersionDiff['fieldDiffs'] = [
      {
        fieldKey: 'status',
        fieldName: 'Status',
        oldValue: snapA.status,
        newValue: snapB.status,
        changed: snapA.status !== snapB.status,
      },
      {
        fieldKey: 'priority',
        fieldName: 'Priority',
        oldValue: snapA.priority,
        newValue: snapB.priority,
        changed: snapA.priority !== snapB.priority,
      },
      {
        fieldKey: 'assigneeId',
        fieldName: 'Assignee',
        oldValue: snapA.assigneeId,
        newValue: snapB.assigneeId,
        changed: snapA.assigneeId !== snapB.assigneeId,
      },
      {
        fieldKey: 'folderId',
        fieldName: 'Folder',
        oldValue: snapA.folderId,
        newValue: snapB.folderId,
        changed: snapA.folderId !== snapB.folderId,
      },
    ];

    // Check custom fields diff
    const customA = (snapA.customFields as Record<string, unknown>) || {};
    const customB = (snapB.customFields as Record<string, unknown>) || {};
    const allCustomKeys = Array.from(new Set([...Object.keys(customA), ...Object.keys(customB)]));

    for (const key of allCustomKeys) {
      fieldDiffs.push({
        fieldKey: `custom_${key}`,
        fieldName: key,
        oldValue: customA[key],
        newValue: customB[key],
        changed: JSON.stringify(customA[key]) !== JSON.stringify(customB[key]),
      });
    }

    return {
      versionA: v1,
      versionB: v2,
      nameDiff: {
        old: nameOld,
        new: nameNew,
        changed: nameOld !== nameNew,
      },
      descriptionDiffHtml,
      fieldDiffs,
    };
  }

  async revertToVersion(id: string, versionNumber: number, userId: string): Promise<ItemDetail> {
    const targetVersion = await this.prisma.itemVersion.findUnique({
      where: { itemId_versionNumber: { itemId: id, versionNumber } },
    });

    if (!targetVersion) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    const snapshot = (targetVersion.snapshot as Record<string, unknown>) || {};

    return this.updateItem(
      id,
      {
        name: String(snapshot.name || ''),
        description: snapshot.description ? String(snapshot.description) : undefined,
        status: snapshot.status ? String(snapshot.status) : undefined,
        priority: snapshot.priority ? String(snapshot.priority) : undefined,
        assigneeId: snapshot.assigneeId ? String(snapshot.assigneeId) : undefined,
        folderId: snapshot.folderId ? String(snapshot.folderId) : undefined,
        customFields: (snapshot.customFields as Record<string, unknown>) || {},
        changeComment: `Reverted to Version ${versionNumber}`,
      },
      userId,
    );
  }

  async toggleSubscription(id: string, userId: string): Promise<{ isSubscribed: boolean }> {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item || item.isDeleted) throw new NotFoundException('Item not found');

    const existing = await this.prisma.itemSubscription.findUnique({
      where: { itemId_userId: { itemId: id, userId } },
    });

    if (existing) {
      await this.prisma.itemSubscription.delete({
        where: { id: existing.id },
      });
      this.eventEmitter.emit('item.subscribed', new ItemSubscribedEvent(id, userId, false));
      return { isSubscribed: false };
    } else {
      await this.prisma.itemSubscription.create({
        data: {
          itemId: id,
          userId,
        },
      });
      await this.prisma.itemActivityLog.create({
        data: {
          itemId: id,
          userId,
          activityType: ItemActivityType.SUBSCRIBED,
        },
      });
      this.eventEmitter.emit('item.subscribed', new ItemSubscribedEvent(id, userId, true));
      return { isSubscribed: true };
    }
  }

  async reuseItem(id: string, dto: ReuseItemDto, userId: string): Promise<ItemDetail> {
    const sourceItem = await this.prisma.item.findUnique({ where: { id } });
    if (!sourceItem || sourceItem.isDeleted) throw new NotFoundException('Item not found');

    const namePrefix = dto.namePrefix || '[Copy] ';
    return this.createItem(
      sourceItem.projectId,
      {
        itemTypeId: sourceItem.itemTypeId,
        folderId: dto.targetFolderId || sourceItem.folderId,
        name: `${namePrefix}${sourceItem.name}`,
        description: sourceItem.description || undefined,
        priority: sourceItem.priority || undefined,
        status: 'Draft',
        customFields: (sourceItem.customFields as Record<string, unknown>) || undefined,
      },
      userId,
    );
  }

  async bulkUpdateItems(
    projectId: string,
    dto: BulkUpdateItemsDto,
    userId: string,
  ): Promise<{ updatedCount: number; skippedLockedCount: number }> {
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: dto.itemIds },
        projectId,
        isDeleted: false,
      },
    });

    let updatedCount = 0;
    let skippedLockedCount = 0;

    for (const item of items) {
      if (
        item.lockedBy &&
        item.lockedBy !== userId &&
        this.isLockActive(item.lockedBy, item.lockedAt)
      ) {
        skippedLockedCount++;
        continue;
      }

      await this.updateItem(
        item.id,
        {
          status: dto.status,
          priority: dto.priority,
          assigneeId: dto.assigneeId,
          folderId: dto.folderId,
          changeComment: 'Bulk update applied',
        },
        userId,
      );
      updatedCount++;
    }

    return { updatedCount, skippedLockedCount };
  }

  async deleteItem(id: string, userId: string): Promise<{ success: boolean }> {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item || item.isDeleted) throw new NotFoundException('Item not found');

    await this.prisma.item.update({
      where: { id },
      data: { isDeleted: true, updatedBy: userId },
    });

    return { success: true };
  }
}
