import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { BulkUpdateItemsDto } from '@aljama/shared';
import { itemQueryKeys } from './use-item-detail';

export function useBulkUpdateItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, dto }: { projectId: string; dto: BulkUpdateItemsDto }) =>
      itemApi.bulkUpdate(projectId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['explorer-tree', variables.projectId],
      });
    },
  });
}
