import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, FetchReviewsParams } from '../api/reviewApi';
import {
  CreateReviewDto,
  InitiateReviewDto,
  UpdateReviewItemStatusDto,
  BatchUpdateReviewItemStatusDto,
  CreateReviewCommentDto,
} from '@aljama/shared';

export const reviewQueryKeys = {
  all: ['reviews'] as const,
  templates: (projectId: string) => [...reviewQueryKeys.all, 'templates', projectId] as const,
  lists: () => [...reviewQueryKeys.all, 'list'] as const,
  list: (params: FetchReviewsParams) => [...reviewQueryKeys.lists(), params] as const,
  details: () => [...reviewQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...reviewQueryKeys.details(), id] as const,
  comments: (reviewId: string, itemId: string) =>
    [...reviewQueryKeys.detail(reviewId), 'items', itemId, 'comments'] as const,
  allComments: (reviewId: string) => [...reviewQueryKeys.detail(reviewId), 'all-comments'] as const,
};

export function useReviewTemplates(projectId?: string) {
  return useQuery({
    queryKey: reviewQueryKeys.templates(projectId || ''),
    queryFn: () => reviewApi.getTemplates(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReviewsList(params: FetchReviewsParams = {}) {
  return useQuery({
    queryKey: reviewQueryKeys.list(params),
    queryFn: () => reviewApi.getReviews(params),
  });
}

export function useReviewDetail(reviewId?: string) {
  return useQuery({
    queryKey: reviewQueryKeys.detail(reviewId || ''),
    queryFn: () => reviewApi.getReviewDetail(reviewId!),
    enabled: !!reviewId,
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReviewDto) => reviewApi.createReview(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() });
    },
  });
}

export function useInitiateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, dto }: { reviewId: string; dto?: InitiateReviewDto }) =>
      reviewApi.initiateReview(reviewId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(variables.reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() });
    },
  });
}

export function useUpdateReviewItemStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      itemId,
      dto,
    }: {
      reviewId: string;
      itemId: string;
      dto: UpdateReviewItemStatusDto;
    }) => reviewApi.updateItemStatus(reviewId, itemId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(variables.reviewId) });
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.comments(variables.reviewId, variables.itemId),
      });
    },
  });
}

export function useBatchUpdateReviewStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, dto }: { reviewId: string; dto: BatchUpdateReviewItemStatusDto }) =>
      reviewApi.batchUpdateStatus(reviewId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(variables.reviewId) });
    },
  });
}

export function useCompleteReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.completeReview(reviewId),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() });
    },
  });
}

export function useItemCommentsQuery(reviewId?: string, itemId?: string, revisionNumber?: number) {
  return useQuery({
    queryKey: reviewQueryKeys.comments(reviewId || '', itemId || ''),
    queryFn: () => reviewApi.getItemComments(reviewId!, itemId!, revisionNumber),
    enabled: !!reviewId && !!itemId,
  });
}

export function useCreateReviewCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      itemId,
      dto,
    }: {
      reviewId: string;
      itemId: string;
      dto: CreateReviewCommentDto;
    }) => reviewApi.createComment(reviewId, itemId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.comments(variables.reviewId, variables.itemId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.allComments(variables.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(variables.reviewId) });
    },
  });
}

export function useAllReviewCommentsQuery(reviewId?: string, revisionNumber?: number) {
  return useQuery({
    queryKey: [...reviewQueryKeys.allComments(reviewId || ''), revisionNumber],
    queryFn: () => reviewApi.getAllComments(reviewId!, revisionNumber),
    enabled: !!reviewId,
  });
}

export function useResolveCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      commentId,
      isResolved,
      resolvedNote,
    }: {
      reviewId: string;
      commentId: string;
      isResolved: boolean;
      resolvedNote?: string;
    }) => reviewApi.resolveComment(reviewId, commentId, isResolved, resolvedNote),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.allComments(variables.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(variables.reviewId) });
    },
  });
}

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, commentId }: { reviewId: string; commentId: string }) =>
      reviewApi.deleteComment(reviewId, commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.allComments(variables.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(variables.reviewId) });
    },
  });
}

export function useCloseForFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.closeForFeedback(reviewId),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() });
    },
  });
}

export function useReopenReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.reopenReview(reviewId),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() });
    },
  });
}

export function useFinalizeReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.finalizeReview(reviewId),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() });
    },
  });
}

export function usePublishRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      dto,
    }: {
      reviewId: string;
      dto?: { changeDescription?: string; deadline?: string; notifyParticipants?: boolean };
    }) => reviewApi.publishRevision(reviewId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(variables.reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.allComments(variables.reviewId) });
    },
  });
}
