import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryItemsDto } from './dto/query-items.dto';
import { ItemSummary, PaginatedResult } from '@aljama/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Dynamic sorting
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

    const mappedItems: ItemSummary[] = items.map((item) => ({
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
      isLocked: !!item.lockedBy,
      lockedBy: item.locker
        ? {
            id: item.locker.id,
            fullName: item.locker.fullName,
          }
        : null,
      lockedAt: item.lockedAt ? item.lockedAt.toISOString() : null,
      customFields: (item.customFields as Record<string, unknown>) || null,
      updatedAt: item.updatedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    }));

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

    return items.map((item) => ({
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
      isLocked: !!item.lockedBy,
      lockedBy: item.locker
        ? {
            id: item.locker.id,
            fullName: item.locker.fullName,
          }
        : null,
      lockedAt: item.lockedAt ? item.lockedAt.toISOString() : null,
      customFields: (item.customFields as Record<string, unknown>) || null,
      updatedAt: item.updatedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }
}
