import { LicenseType, UserStatus, ProjectRole, ProjectStatus } from '../constants';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  licenseType: LicenseType;
  status: UserStatus;
}

export interface AuthTokens {
  accessToken: string;
  user: UserSummary;
}

export interface ProjectSummary {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  userRole?: ProjectRole;
  itemCount?: number;
  updatedAt: string;
}

export interface ExplorerNode {
  id: string;
  key?: string; // e.g. "MED-REQ-001" for items
  name: string;
  type: 'folder' | 'item';
  itemTypeKey?: string; // e.g. "REQ", "UC", "TC"
  icon?: string | null;
  status?: string | null;
  priority?: string | null;
  parentId?: string | null;
  orderIndex: number;
  children?: ExplorerNode[];
}

export interface ItemSummary {
  id: string;
  projectId: string;
  folderId?: string | null;
  itemTypeId: string;
  itemTypeKey: string;
  itemTypeName: string;
  itemTypeIcon?: string | null;
  itemKey: string;
  name: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  assignee?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  currentVersion: number;
  isLocked: boolean;
  lockedBy?: {
    id: string;
    fullName: string;
  } | null;
  lockedAt?: string | null;
  customFields?: Record<string, unknown> | null;
  updatedAt: string;
  createdAt: string;
}

export interface ItemDetail extends ItemSummary {
  folder?: { id: string; name: string } | null;
  creator: { id: string; fullName: string; email?: string };
  updater?: { id: string; fullName: string } | null;
  versionsCount: number;
  isSubscribed: boolean;
  subscriptionsCount: number;
  connectedUsersCount: number;
  commentsCount: number;
  relationshipsCount: number;
}

export interface ItemVersionSummary {
  id: string;
  itemId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  changeDetails?: string | null;
  changeComment?: string | null;
  changedBy: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  changedAt: string;
}

export interface ItemVersionDiff {
  versionA: number;
  versionB: number;
  nameDiff: { old: string; new: string; changed: boolean };
  descriptionDiffHtml: string;
  fieldDiffs: Array<{
    fieldKey: string;
    fieldName: string;
    oldValue: unknown;
    newValue: unknown;
    changed: boolean;
  }>;
}

export interface ItemTypeFieldSummary {
  id: string;
  fieldLabel: string;
  name?: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  options?: unknown;
  displayOrder: number;
}

export interface ItemTypeWithFields {
  id: string;
  key: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  fields: ItemTypeFieldSummary[];
}

export interface FolderSummary {
  id: string;
  name: string;
  parentFolderId?: string | null;
  orderIndex: number;
}

export interface ProjectMemberSummary {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
  projectRole: string;
}

export interface CreateItemDto {
  name: string;
  itemTypeId: string;
  folderId?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  assigneeId?: string | null;
  customFields?: Record<string, unknown> | null;
}

export interface UpdateItemDto {
  name?: string;
  folderId?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  assigneeId?: string | null;
  customFields?: Record<string, unknown> | null;
  changeComment?: string | null;
}

export interface BulkUpdateItemsDto {
  itemIds: string[];
  priority?: string;
  status?: string;
  assigneeId?: string | null;
  folderId?: string | null;
}

export interface ReuseItemDto {
  targetFolderId?: string | null;
  namePrefix?: string;
}
