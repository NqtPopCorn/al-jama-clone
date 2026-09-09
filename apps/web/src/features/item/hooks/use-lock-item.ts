import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { itemQueryKeys } from './use-item-detail';

export function useLockItem(itemId: string) {
  const queryClient = useQueryClient();

  const lockMutation = useMutation({
    mutationFn: () => itemApi.lockItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => itemApi.unlockItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
    },
  });

  return {
    lock: lockMutation.mutateAsync,
    unlock: unlockMutation.mutateAsync,
    isLocking: lockMutation.isPending,
    isUnlocking: unlockMutation.isPending,
  };
}
