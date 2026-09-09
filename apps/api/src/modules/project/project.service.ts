import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExplorerNode, ProjectRole, ProjectStatus, ProjectSummary } from '@aljama/shared';

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

    return memberships.map((m) => ({
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

    const typeCountMap = itemTypeCounts.map((tc) => {
      const it = itemTypes.find((t) => t.id === tc.itemTypeId);
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
        statusBreakdown: itemStatusCounts.map((sc) => ({
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
        .filter((item) => item.folderId === folderId)
        .map((item) => ({
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
      const childFolders = folders
        .filter((f) => f.parentFolderId === folder.id)
        .map(buildFolderNode);
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
    const rootFolders = folders
      .filter((f) => f.parentFolderId === null)
      .map(buildFolderNode);

    // Items without folder (root items)
    const unassignedItems = items
      .filter((item) => !item.folderId)
      .map((item) => ({
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
}
