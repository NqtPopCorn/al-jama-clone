import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFolderDto,
  ExplorerNode,
  FolderSummary,
  ItemTypeWithFields,
  ProjectMemberSummary,
  ProjectRole,
  ProjectStatus,
  ProjectSummary,
} from '@aljama/shared';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProjects(userId: string): Promise<ProjectSummary[]> {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: {
              select: {
                items: {
                  where: { isDeleted: false },
                },
              },
            },
          },
        },
      },
      orderBy: {
        project: {
          updatedAt: 'desc',
        },
      },
    });

    return memberships.map(m => ({
      id: m.project.id,
      key: m.project.key,
      name: m.project.name,
      description: m.project.description,
      status: m.project.status as unknown as ProjectStatus,
      userRole: m.projectRole as unknown as ProjectRole,
      itemCount: m.project._count.items,
      updatedAt: m.project.updatedAt.toISOString(),
    }));
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
        _count: {
          select: {
            items: { where: { isDeleted: false } },
            folders: true,
            itemTypes: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.members.length === 0) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const itemStatusCounts = await this.prisma.item.groupBy({
      by: ['status'],
      where: { projectId, isDeleted: false },
      _count: { id: true },
    });

    const itemTypeCounts = await this.prisma.item.groupBy({
      by: ['itemTypeId'],
      where: { projectId, isDeleted: false },
      _count: { id: true },
    });

    const itemTypes = await this.prisma.itemType.findMany({
      where: { projectId },
      select: { id: true, key: true, name: true, icon: true },
    });

    const typeCountMap = itemTypeCounts.map(tc => {
      const it = itemTypes.find(t => t.id === tc.itemTypeId);
      return {
        itemTypeId: tc.itemTypeId,
        key: it?.key || 'UNKNOWN',
        name: it?.name || 'Unknown',
        icon: it?.icon,
        count: tc._count.id,
      };
    });

    return {
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      status: project.status,
      userRole: project.members[0].projectRole,
      stats: {
        totalItems: project._count.items,
        totalFolders: project._count.folders,
        totalItemTypes: project._count.itemTypes,
        statusBreakdown: itemStatusCounts.map(sc => ({
          status: sc.status || 'Unspecified',
          count: sc._count.id,
        })),
        typeBreakdown: typeCountMap,
      },
      updatedAt: project.updatedAt.toISOString(),
      createdAt: project.createdAt.toISOString(),
    };
  }

  async getExplorerTree(projectId: string, userId: string): Promise<ExplorerNode[]> {
    // 1. Verify project membership
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // 2. Fetch all folders
    const folders = await this.prisma.folder.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
    });

    // 3. Fetch all active items
    const items = await this.prisma.item.findMany({
      where: { projectId, isDeleted: false },
      include: {
        itemType: {
          select: { key: true, name: true, icon: true },
        },
      },
      orderBy: { itemKey: 'asc' },
    });

    // 4. Build Tree
    // Helper to get items for a given folder
    const getItemsForFolder = (folderId: string): ExplorerNode[] => {
      return items
        .filter(item => item.folderId === folderId)
        .map(item => ({
          id: item.id,
          key: item.itemKey,
          name: item.name,
          type: 'item',
          itemTypeKey: item.itemType.key,
          icon: item.itemType.icon,
          status: item.status,
          priority: item.priority,
          parentId: folderId,
          orderIndex: 0,
        }));
    };

    // Recursive folder builder
    const buildFolderNode = (folder: (typeof folders)[0]): ExplorerNode => {
      const childFolders = folders.filter(f => f.parentFolderId === folder.id).map(buildFolderNode);
      const folderItems = getItemsForFolder(folder.id);

      return {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentFolderId,
        orderIndex: folder.orderIndex,
        children: [...childFolders, ...folderItems],
      };
    };

    // Top-level folders (parentFolderId is null)
    const rootFolders = folders.filter(f => f.parentFolderId === null).map(buildFolderNode);

    // Items without folder (root items)
    const unassignedItems = items
      .filter(item => !item.folderId)
      .map(item => ({
        id: item.id,
        key: item.itemKey,
        name: item.name,
        type: 'item' as const,
        itemTypeKey: item.itemType.key,
        icon: item.itemType.icon,
        status: item.status,
        priority: item.priority,
        parentId: null,
        orderIndex: 0,
      }));

    return [...rootFolders, ...unassignedItems];
  }

  async getItemTypesWithFields(projectId: string): Promise<ItemTypeWithFields[]> {
    const types = await this.prisma.itemType.findMany({
      where: { projectId },
      orderBy: { key: 'asc' },
      include: {
        fields: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return types.map(t => ({
      id: t.id,
      key: t.key,
      name: t.name,
      icon: t.icon,
      description: t.description,
      fields: t.fields.map(f => ({
        id: f.id,
        fieldLabel: f.fieldLabel,
        name: f.fieldLabel,
        fieldKey: f.fieldKey,
        fieldType: f.fieldType,
        isRequired: f.isRequired,
        options: f.options,
        displayOrder: f.displayOrder,
      })),
    }));
  }

  async getProjectMembers(projectId: string): Promise<ProjectMemberSummary[]> {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    return members.map(m => ({
      id: m.id,
      userId: m.user.id,
      fullName: m.user.fullName,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      projectRole: m.projectRole,
    }));
  }

  async getProjectFolders(projectId: string): Promise<FolderSummary[]> {
    const folders = await this.prisma.folder.findMany({
      where: { projectId },
      orderBy: [{ parentFolderId: 'asc' }, { orderIndex: 'asc' }],
    });

    return folders.map(f => ({
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId,
      orderIndex: f.orderIndex,
    }));
  }

  async createFolder(
    projectId: string,
    userId: string,
    dto: CreateFolderDto,
  ): Promise<FolderSummary> {
    // 1. Verify project membership
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // 2. If parentFolderId is specified, verify it exists and belongs to the same project
    if (dto.parentFolderId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: {
          id: dto.parentFolderId,
          projectId,
        },
      });

      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found in this project');
      }
    }

    // 3. Determine orderIndex if not specified
    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const maxOrderFolder = await this.prisma.folder.findFirst({
        where: {
          projectId,
          parentFolderId: dto.parentFolderId || null,
        },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      orderIndex = maxOrderFolder ? maxOrderFolder.orderIndex + 1 : 0;
    }

    // 4. Create the folder
    const folder = await this.prisma.folder.create({
      data: {
        projectId,
        name: dto.name.trim(),
        parentFolderId: dto.parentFolderId || null,
        orderIndex,
      },
    });

    return {
      id: folder.id,
      name: folder.name,
      parentFolderId: folder.parentFolderId,
      orderIndex: folder.orderIndex,
    };
  }
}
