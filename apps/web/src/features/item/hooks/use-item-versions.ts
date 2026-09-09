import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { itemQueryKeys } from './use-item-detail';

export function useItemVersions(itemId?: string | null) {
  return useQuery({
    queryKey: itemQueryKeys.versions(itemId || ''),
    queryFn: () => itemApi.getItemVersions(itemId!),
    enabled: !!itemId,
  });
}

export function useCompareVersions(itemId: string, v1?: number | null, v2?: number | null) {
  return useQuery({
    queryKey: itemQueryKeys.compare(itemId, v1 || 0, v2 || 0),
    queryFn: () => itemApi.compareVersions(itemId, v1!, v2!),
    enabled: !!itemId && typeof v1 === 'number' && typeof v2 === 'number' && v1 > 0 && v2 > 0,
  });
}

export function useRevertVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, versionNumber }: { itemId: string; versionNumber: number }) =>
      itemApi.revertToVersion(itemId, versionNumber),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(itemQueryKeys.detail(variables.itemId), data);
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.versions(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
    },
  });
}
