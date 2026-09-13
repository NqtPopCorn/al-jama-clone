import { api } from '../../../lib/api';
import {
  ApiResponse,
  BulkUpdateItemsDto,
  CreateFolderDto,
  CreateItemDto,
  FolderSummary,
  ItemDetail,
  ItemSummary,
  ItemTypeWithFields,
  ItemVersionDiff,
  ItemVersionSummary,
  PaginatedResult,
  ProjectMemberSummary,
  ReuseItemDto,
  UpdateItemDto,
} from '@aljama/shared';

export interface QueryItemsParams {
  page?: number;
  limit?: number;
  folderId?: string;
  itemTypeId?: string;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const itemApi = {
  getProjectItems: async (projectId: string, params: QueryItemsParams) => {
    const res = await api.get<ApiResponse<PaginatedResult<ItemSummary>>>(
      `/projects/${projectId}/items`,
      { params },
    );
    return res.data.data!;
  },

  getReadingView: async (projectId: string, folderId?: string) => {
    const res = await api.get<ApiResponse<unknown[]>>(`/projects/${projectId}/reading-view`, {
      params: { folderId },
    });
    return res.data.data!;
  },

  getItemDetail: async (itemId: string) => {
    const res = await api.get<ApiResponse<ItemDetail>>(`/items/${itemId}/detail`);
    return res.data.data!;
  },

  createItem: async (projectId: string, dto: CreateItemDto) => {
    const res = await api.post<ApiResponse<ItemDetail>>(`/projects/${projectId}/items`, dto);
    return res.data.data!;
  },

  updateItem: async (itemId: string, dto: UpdateItemDto) => {
    const res = await api.put<ApiResponse<ItemDetail>>(`/items/${itemId}`, dto);
    return res.data.data!;
  },

  lockItem: async (itemId: string) => {
    const res = await api.post<
      ApiResponse<{ success: boolean; lockedBy: string; lockedAt: string }>
    >(`/items/${itemId}/lock`);
    return res.data.data!;
  },

  unlockItem: async (itemId: string) => {
    const res = await api.post<ApiResponse<{ success: boolean }>>(`/items/${itemId}/unlock`);
    return res.data.data!;
  },

  getItemVersions: async (itemId: string) => {
    const res = await api.get<ApiResponse<ItemVersionSummary[]>>(`/items/${itemId}/versions`);
    return res.data.data!;
  },

  compareVersions: async (itemId: string, v1: number, v2: number) => {
    const res = await api.get<ApiResponse<ItemVersionDiff>>(`/items/${itemId}/versions/compare`, {
      params: { v1, v2 },
    });
    return res.data.data!;
  },

  revertToVersion: async (itemId: string, versionNumber: number) => {
    const res = await api.post<ApiResponse<ItemDetail>>(`/items/${itemId}/revert`, null, {
      params: { version: versionNumber },
    });
    return res.data.data!;
  },

  toggleSubscription: async (itemId: string) => {
    const res = await api.post<ApiResponse<{ isSubscribed: boolean }>>(
      `/items/${itemId}/subscribe`,
    );
    return res.data.data!;
  },

  reuseItem: async (itemId: string, dto: ReuseItemDto) => {
    const res = await api.post<ApiResponse<ItemDetail>>(`/items/${itemId}/reuse`, dto);
    return res.data.data!;
  },

  bulkUpdate: async (projectId: string, dto: BulkUpdateItemsDto) => {
    const res = await api.patch<ApiResponse<{ updatedCount: number; skippedLockedCount: number }>>(
      `/projects/${projectId}/items/bulk`,
      dto,
    );
    return res.data.data!;
  },

  deleteItem: async (itemId: string) => {
    const res = await api.delete<ApiResponse<{ success: boolean }>>(`/items/${itemId}`);
    return res.data.data!;
  },

  // Project helpers
  getItemTypes: async (projectId: string) => {
    const res = await api.get<ApiResponse<ItemTypeWithFields[]>>(
      `/projects/${projectId}/item-types`,
    );
    return res.data.data!;
  },

  getProjectMembers: async (projectId: string) => {
    const res = await api.get<ApiResponse<ProjectMemberSummary[]>>(
      `/projects/${projectId}/members`,
    );
    return res.data.data!;
  },

  getProjectFolders: async (projectId: string) => {
    const res = await api.get<ApiResponse<FolderSummary[]>>(`/projects/${projectId}/folders`);
    return res.data.data!;
  },

  createFolder: async (projectId: string, data: CreateFolderDto) => {
    const res = await api.post<ApiResponse<FolderSummary>>(`/projects/${projectId}/folders`, data);
    return res.data.data!;
  },
};
