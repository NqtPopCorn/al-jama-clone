import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface CommentAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface CommentMention {
  id: string;
  mentionedType: string;
  mentionedId: string;
}

export interface CommentData {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  mentions?: CommentMention[];
  parentCommentId?: string | null;
  parent?: {
    id: string;
    content: string;
    author: { id: string; fullName: string };
  } | null;
  item?: {
    id: string;
    name: string;
    itemKey: string;
  } | null;
}

export interface CreateCommentPayload {
  content: string;
  parentCommentId?: string;
  mentionedUserIds?: string[];
}

export const useComments = (itemId?: string, projectId?: string) => {
  const queryClient = useQueryClient();
  const targetKey = itemId ? ['comments', 'item', itemId] : ['comments', 'project', projectId];
  const isEnabled = !!itemId || !!projectId;

  const commentsQuery = useQuery({
    queryKey: targetKey,
    queryFn: async (): Promise<CommentData[]> => {
      if (itemId) {
        const res = await api.get(`/items/${itemId}/comments`);
        return res.data;
      }
      if (projectId) {
        const res = await api.get(`/projects/${projectId}/comments`);
        return res.data;
      }
      return [];
    },
    enabled: isEnabled,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: CreateCommentPayload) => {
      if (itemId) {
        const res = await api.post(`/items/${itemId}/comments`, data);
        return res.data;
      }
      if (projectId) {
        const res = await api.post(`/projects/${projectId}/comments`, data);
        return res.data;
      }
      throw new Error('Neither itemId nor projectId was provided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: targetKey });
      if (itemId && projectId) {
        queryClient.invalidateQueries({ queryKey: ['comments', 'project', projectId] });
      }
    },
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    isError: commentsQuery.isError,
    refetch: commentsQuery.refetch,
    createComment: createCommentMutation.mutateAsync,
    isCreating: createCommentMutation.isPending,
  };
};
