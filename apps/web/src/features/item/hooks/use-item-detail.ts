import { useQuery } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';

export const itemQueryKeys = {
  all: ['items'] as const,
  lists: () => [...itemQueryKeys.all, 'list'] as const,
  list: (projectId: string, query: unknown) =>
    [...itemQueryKeys.lists(), projectId, query] as const,
  details: () => [...itemQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemQueryKeys.details(), id] as const,
  versions: (id: string) => [...itemQueryKeys.detail(id), 'versions'] as const,
  compare: (id: string, v1: number, v2: number) =>
    [...itemQueryKeys.versions(id), 'compare', v1, v2] as const,
  types: (projectId: string) => ['projects', projectId, 'item-types'] as const,
  members: (projectId: string) => ['projects', projectId, 'members'] as const,
  folders: (projectId: string) => ['projects', projectId, 'folders'] as const,
};

export function useItemDetail(itemId?: string | null) {
  return useQuery({
    queryKey: itemQueryKeys.detail(itemId || ''),
    queryFn: () => itemApi.getItemDetail(itemId!),
    enabled: !!itemId,
  });
}
