import { ReviewDetail, ReviewItemReadingView, ReviewRole } from '@aljama/shared';

export type ActiveFilter =
  | 'ALL'
  | 'APPROVED'
  | 'NEED_WORK'
  | 'WITH_MY_COMMENTS'
  | 'WITH_COMMENTS'
  | 'UPDATED_SINCE_V1'
  | 'UNMARKED';

export type ViewMode = 'READING_VIEW' | 'SINGLE_ITEM_VIEW';

export interface ReviewExecutionContext {
  review: ReviewDetail;
  activeRole: ReviewRole;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  isModeratorMode: boolean;
}
