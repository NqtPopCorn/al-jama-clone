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
