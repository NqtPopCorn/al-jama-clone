// System Constants
export const APP_NAME = 'AL-JAMA';
export const API_PREFIX = 'api';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// License Types
export enum LicenseType {
  CREATOR = 'creator',
  EXPLORER = 'explorer',
  REVIEWER = 'reviewer',
}

// Item Status
export enum ItemStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DEPRECATED = 'deprecated',
}

// Review Status
export enum ReviewStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  PENDING_REVISION = 'pending_revision',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}
