import { api } from '../../../lib/api';
import {
  ReviewSummary,
  ReviewDetail,
  ReviewCommentSummary,
  CreateReviewDto,
  InitiateReviewDto,
  UpdateReviewItemStatusDto,
  BatchUpdateReviewItemStatusDto,
  CreateReviewCommentDto,
  ApiResponse,
} from '@aljama/shared';

export interface FetchReviewsParams {
  projectId?: string;
  scope?: 'my' | 'all';
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface FetchReviewsResponse {
  items: ReviewSummary[];
  total: number;
  myCount: number;
  allCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const reviewApi = {
  getReviews: async (params: FetchReviewsParams = {}) => {
    const res = await api.get<ApiResponse<FetchReviewsResponse>>('/reviews', { params });
    return res.data.data;
  },

  getReviewDetail: async (reviewId: string) => {
    const res = await api.get<ApiResponse<ReviewDetail>>(`/reviews/${reviewId}`);
    return res.data.data;
  },

  createReview: async (dto: CreateReviewDto) => {
    const res = await api.post<ApiResponse<ReviewDetail>>('/reviews', dto);
    return res.data.data;
  },

  initiateReview: async (reviewId: string, dto: InitiateReviewDto = {}) => {
    const res = await api.post<ApiResponse<ReviewDetail>>(`/reviews/${reviewId}/initiate`, dto);
    return res.data.data;
  },

  updateItemStatus: async (reviewId: string, itemId: string, dto: UpdateReviewItemStatusDto) => {
    const res = await api.patch<ApiResponse<unknown>>(
      `/reviews/${reviewId}/items/${itemId}/status`,
      dto,
    );
    return res.data.data;
  },

  batchUpdateStatus: async (reviewId: string, dto: BatchUpdateReviewItemStatusDto) => {
    const res = await api.post<ApiResponse<{ success: boolean; updatedCount: number }>>(
      `/reviews/${reviewId}/items/batch-status`,
      dto,
    );
    return res.data.data;
  },

  completeReview: async (reviewId: string) => {
    const res = await api.post<ApiResponse<unknown>>(`/reviews/${reviewId}/complete`);
    return res.data.data;
  },

  getItemComments: async (reviewId: string, itemId: string, revisionNumber?: number) => {
    const res = await api.get<ApiResponse<ReviewCommentSummary[]>>(
      `/reviews/${reviewId}/items/${itemId}/comments`,
      { params: { revisionNumber } },
    );
    return res.data.data;
  },

  createComment: async (reviewId: string, itemId: string, dto: CreateReviewCommentDto) => {
    const res = await api.post<ApiResponse<ReviewCommentSummary>>(
      `/reviews/${reviewId}/items/${itemId}/comments`,
      dto,
    );
    return res.data.data;
  },

  closeForFeedback: async (reviewId: string) => {
    const res = await api.post<ApiResponse<unknown>>(`/reviews/${reviewId}/close-for-feedback`);
    return res.data.data;
  },

  reopenReview: async (reviewId: string) => {
    const res = await api.post<ApiResponse<unknown>>(`/reviews/${reviewId}/reopen`);
    return res.data.data;
  },

  finalizeReview: async (reviewId: string) => {
    const res = await api.post<ApiResponse<unknown>>(`/reviews/${reviewId}/finalize`);
    return res.data.data;
  },
};
