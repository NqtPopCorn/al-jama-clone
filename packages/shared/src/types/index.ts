import {
  LicenseType,
  UserStatus,
  ProjectRole,
  ProjectStatus,
  ReviewStatus,
  ReviewRole,
  ReviewItemStatusValue,
  ReviewCommentLabel,
  ReviewTemplateType,
  BaselineTriggerType,
} from '../constants';

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
  hasSuspect?: boolean;
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

export interface CreateFolderDto {
  name: string;
  parentFolderId?: string | null;
  orderIndex?: number;
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

// -----------------------------------------------------------------------------
// TRACEABILITY (EPIC E3)
// -----------------------------------------------------------------------------

export interface RelationshipTypeSummary {
  id: string;
  projectId?: string | null;
  name: string;
  inverseName: string;
  isRequiredDefault: boolean;
  suspectOnUpstreamChange: boolean;
}

export interface RelatedItemSummary {
  id: string;
  itemKey: string;
  name: string;
  itemTypeId: string;
  itemTypeKey: string;
  itemTypeName: string;
  itemTypeIcon?: string | null;
  status?: string | null;
  priority?: string | null;
  currentVersion: number;
}

export interface ItemRelationshipSummary {
  id: string;
  projectId: string;
  direction: 'upstream' | 'downstream';
  relatedItem: RelatedItemSummary;
  relationshipType: RelationshipTypeSummary;
  isSuspect: boolean;
  suspectFlaggedAt?: string | null;
  suspectReason?: string | null;
  clearedBy?: { id: string; fullName: string } | null;
  clearedAt?: string | null;
  createdBy: { id: string; fullName: string };
  createdAt: string;
}

export interface CreateRelationshipDto {
  upstreamItemId: string;
  downstreamItemId: string;
  relationshipTypeId: string;
}

export interface ImpactAnalysisNode {
  id: string;
  itemKey: string;
  name: string;
  itemTypeKey: string;
  itemTypeName: string;
  status?: string | null;
  depth: number;
  direction: 'root' | 'upstream' | 'downstream';
  relationshipPhrase: string;
  isSuspect: boolean;
  suspectReason?: string | null;
  children: ImpactAnalysisNode[];
}

export interface ImpactAnalysisResult {
  rootItem: RelatedItemSummary;
  upstreamNodes: ImpactAnalysisNode[];
  downstreamNodes: ImpactAnalysisNode[];
  totalImpactedCount: number;
  suspectCount: number;
}

export interface TraceMatrixRow {
  sourceItem: RelatedItemSummary;
  linkedItems: Array<{
    relationshipId: string;
    item: RelatedItemSummary;
    relationshipTypeName: string;
    direction?: 'upstream' | 'downstream';
    isSuspect: boolean;
    isRequired: boolean;
  }>;
  isCovered: boolean;
}

export interface TraceMatrixResult {
  sourceType: { id: string; key: string; name: string };
  targetType: { id: string; key: string; name: string };
  rows: TraceMatrixRow[];
  totalSourceItems: number;
  coveredItemsCount: number;
  coveragePercentage: number;
}

// -----------------------------------------------------------------------------
// REVIEW CENTER (EPIC E5 & E6)
// -----------------------------------------------------------------------------

export interface ReviewSummary {
  id: string;
  key: string;
  name: string;
  projectId: string;
  projectName: string;
  isPublic: boolean;
  status: ReviewStatus;
  role?: ReviewRole | string | null;
  revisionNumber: number;
  moderatorNames: string[];
  deadline?: string | null;
  itemCount: number;
  createdAt: string;
}

export interface ReviewTemplateSummary {
  id: string;
  projectId: string;
  name: string;
  type: ReviewTemplateType;
  requiresSignature: boolean;
  enableTimeTracking: boolean;
  allowApproverAddParticipant: boolean;
  allowDelegate: boolean;
  isEditableOnCreate: boolean;
}

export interface ReviewParticipantSummary {
  id: string;
  reviewId: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  reviewRole: ReviewRole;
  isSigner: boolean;
  isFinished: boolean;
  finishedAt?: string | null;
}

export interface ReviewItemUserStatus {
  userId: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
}

export interface ReviewItemReadingView {
  id: string; // reviewItemId
  itemId: string;
  itemKey: string;
  name: string;
  itemTypeName?: string;
  itemTypeIcon?: string | null;
  orderIndex: number;
  includeUpstream: boolean;
  includeDownstream: boolean;
  customFields?: Record<string, unknown> | null;
  description?: string | null;
  status: ReviewItemStatusValue;
  commentCount: number;
  hasUpdatedSinceLastRevision?: boolean;
  baselineVersion?: number;
  latestVersion?: number;
  baselineContent?: {
    name?: string;
    description?: string | null;
    customFields?: Record<string, unknown> | null;
  };
  editedContent?: {
    name?: string;
    description?: string | null;
    customFields?: Record<string, unknown> | null;
  };
  overallStatusSummary?: {
    approvedCount: number;
    rejectedCount: number;
    reviewedCount: number;
    totalApprovers: number;
    approvedUsers?: ReviewItemUserStatus[];
    rejectedUsers?: ReviewItemUserStatus[];
  };
}

export interface ReviewCommentMentionSummary {
  userId: string;
  username: string;
  fullName: string;
}

export interface ReviewCommentSummary {
  id: string;
  reviewItemId: string;
  itemKey?: string;
  itemName?: string;
  parentCommentId?: string | null;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  revisionNumber: number;
  label: ReviewCommentLabel;
  content: string;
  selectedText?: string | null;
  isResolved: boolean;
  resolvedNote?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  likesCount?: number;
  isBookmarked?: boolean;
  createdAt: string;
  mentions?: ReviewCommentMentionSummary[];
  replies?: ReviewCommentSummary[];
}

export interface ReviewDetailStats {
  totalItems: number;
  approvedCount: number;
  rejectedCount: number;
  reviewedCount: number;
  unmarkedCount: number;
  totalComments: number;
  myCommentsCount: number;
  updatedSinceLastRevisionCount: number;
}

export interface ReviewDetail {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  projectId: string;
  projectName: string;
  template: ReviewTemplateSummary;
  status: ReviewStatus;
  deadline?: string | null;
  currentRevisionNumber: number;
  includeContext: boolean;
  participants: ReviewParticipantSummary[];
  items: ReviewItemReadingView[];
  myRole?: ReviewRole;
  myIsFinished?: boolean;
  stats: ReviewDetailStats;
  createdBy?: string;
  isModerator?: boolean;
  availableRoles?: ('MODERATOR' | 'APPROVER' | 'REVIEWER')[];
}

export interface CreateReviewParticipantInput {
  userId?: string;
  groupId?: string;
  reviewRole: ReviewRole;
  isSigner?: boolean;
}

export interface CreateReviewDto {
  projectId: string;
  templateId?: string;
  name: string;
  description?: string;
  deadline?: string;
  itemIds: string[];
  participants: CreateReviewParticipantInput[];
  includeContext?: boolean;
  initiateImmediately?: boolean;
}

export interface InitiateReviewDto {
  message?: string;
  deadline?: string;
}

export interface UpdateReviewItemStatusDto {
  status: ReviewItemStatusValue;
  rejectionComment?: string;
}

export interface BatchUpdateReviewItemStatusDto {
  reviewItemIds: string[];
  status: ReviewItemStatusValue;
  rejectionComment?: string;
}

export interface CreateReviewCommentDto {
  content: string;
  label?: ReviewCommentLabel;
  selectedText?: string;
  parentCommentId?: string;
  mentionedUserIds?: string[];
}
