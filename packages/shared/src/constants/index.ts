// System Constants
export const APP_NAME = 'AL-JAMA';
export const API_PREFIX = 'api';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// License Types (QT-08, BR-REV-04, DB Schema)
export enum LicenseType {
  FULL = 'FULL',
  REVIEWER_LIMITED = 'REVIEWER_LIMITED',
}

// User Status
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// Project Roles (3.2 BRD)
export enum ProjectRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  MEMBER = 'MEMBER',
}

// Project Status
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

// Field Types
export enum FieldType {
  TEXT = 'TEXT',
  RICHTEXT = 'RICHTEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  DROPDOWN = 'DROPDOWN',
  USER = 'USER',
  MULTI_SELECT = 'MULTI_SELECT',
}

// Item Status
export enum ItemStatus {
  DRAFT = 'Draft',
  IN_REVIEW = 'In Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  DEPRECATED = 'Deprecated',
}

// Item Priority
export enum ItemPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

// Review Status (3.1 Delivery Plan)
export enum ReviewStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED_FOR_FEEDBACK = 'CLOSED_FOR_FEEDBACK',
  ARCHIVED = 'ARCHIVED',
  FINALIZED = 'FINALIZED',
}

// Review Roles (per review)
export enum ReviewRole {
  MODERATOR = 'MODERATOR',
  APPROVER = 'APPROVER',
  REVIEWER = 'REVIEWER',
}

// Review Item Status (QT-04)
export enum ReviewItemStatusValue {
  NOT_REVIEWED = 'NOT_REVIEWED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Review Comment Labels (BR-REV-13)
export enum ReviewCommentLabel {
  GENERAL = 'GENERAL',
  ISSUE = 'ISSUE',
  QUESTION = 'QUESTION',
  PROPOSED_CHANGE = 'PROPOSED_CHANGE',
}

// Review Template Types
export enum ReviewTemplateType {
  APPROVAL = 'APPROVAL',
  PEER = 'PEER',
}

// Review Baseline Trigger Types (BR-REV-38)
export enum BaselineTriggerType {
  REVIEW_INITIATE = 'REVIEW_INITIATE',
  REVISION_PUBLISH = 'REVISION_PUBLISH',
}
