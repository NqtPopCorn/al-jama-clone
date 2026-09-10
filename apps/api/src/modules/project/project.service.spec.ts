import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRole, ProjectStatus } from '@prisma/client';

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: any;

  const userId = '11111111-1111-1111-1111-111111111111';
  const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      projectMember: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      item: {
        groupBy: jest.fn(),
      },
      itemType: {
        findMany: jest.fn(),
      },
      folder: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  describe('getUserProjects', () => {
    it('should return mapped list of user projects with item counts', async () => {
      const mockMemberships = [
        {
          projectRole: ProjectRole.ADMINISTRATOR,
          project: {
            id: projectId,
            key: 'PRJ',
            name: 'Project Alpha',
            description: 'A test project',
            status: ProjectStatus.ACTIVE,
            updatedAt: new Date('2026-09-01T00:00:00Z'),
            _count: { items: 42 },
          },
        },
      ];
      prisma.projectMember.findMany.mockResolvedValue(mockMemberships);

      const result = await service.getUserProjects(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: projectId,
        key: 'PRJ',
        name: 'Project Alpha',
        description: 'A test project',
        status: ProjectStatus.ACTIVE,
        userRole: ProjectRole.ADMINISTRATOR,
        itemCount: 42,
        updatedAt: '2026-09-01T00:00:00.000Z',
      });
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
    });
  });

  describe('getProjectById', () => {
    it('should return project detail with stats when user is a member', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: projectId,
        key: 'PRJ',
        name: 'Project Alpha',
        description: 'A test project',
        status: ProjectStatus.ACTIVE,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        updatedAt: new Date('2026-09-02T00:00:00Z'),
        members: [{ projectRole: ProjectRole.ADMINISTRATOR }],
        _count: { items: 10, folders: 3, itemTypes: 2 },
      });
      prisma.item.groupBy
        .mockResolvedValueOnce([{ status: 'DRAFT', _count: { id: 6 } }]) // status breakdown
        .mockResolvedValueOnce([{ itemTypeId: 't1', _count: { id: 10 } }]); // type breakdown
      prisma.itemType.findMany.mockResolvedValue([
        { id: 't1', key: 'REQ', name: 'Requirement', icon: 'file' },
      ]);

      const result = await service.getProjectById(projectId, userId);

      expect(result.id).toBe(projectId);
      expect(result.userRole).toBe(ProjectRole.ADMINISTRATOR);
      expect(result.stats.totalItems).toBe(10);
      expect(result.stats.totalFolders).toBe(3);
    });

    it('should throw NotFoundException when project is not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectById(projectId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a member of project', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: projectId,
        members: [], // Not a member
        _count: { items: 0, folders: 0, itemTypes: 0 },
      });

      await expect(service.getProjectById(projectId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProjectFolders', () => {
    it('should return folders ordered by parentFolderId and orderIndex', async () => {
      prisma.folder.findMany.mockResolvedValue([
        { id: 'f1', name: 'Root Folder', parentFolderId: null, orderIndex: 0 },
        { id: 'f2', name: 'Sub Folder', parentFolderId: 'f1', orderIndex: 1 },
      ]);

      const result = await service.getProjectFolders(projectId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Root Folder');
      expect(result[1].parentFolderId).toBe('f1');
    });
  });
});
