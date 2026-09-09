// System Constants
export const APP_NAME = 'AL-JAMA';
export const API_PREFIX = 'api';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// License Types (QT-08, BR-REV-04, DB Schema)
export enum LicenseType {
  FULL = 'full',
  REVIEWER_LIMITED = 'reviewer_limited',
}

// User Status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Project Roles (3.2 BRD)
export enum ProjectRole {
  ADMINISTRATOR = 'administrator',
  MEMBER = 'member',
}

// Project Status
export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

// Field Types
export enum FieldType {
  TEXT = 'text',
  RICHTEXT = 'richtext',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  USER = 'user',
  MULTI_SELECT = 'multi_select',
}

// Item Status
export enum ItemStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DEPRECATED = 'deprecated',
}

// Item Priority
export enum ItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Review Status (3.1 Delivery Plan)
export enum ReviewStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED_FOR_FEEDBACK = 'closed_for_feedback',
  ARCHIVED = 'archived',
  FINALIZED = 'finalized',
}

// Review Roles (per review)
export enum ReviewRole {
  MODERATOR = 'moderator',
  APPROVER = 'approver',
  REVIEWER = 'reviewer',
}

// Review Item Status (QT-04)
export enum ReviewItemStatusValue {
  NOT_REVIEWED = 'not_reviewed',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
