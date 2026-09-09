import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { CreateItemDto } from '@aljama/shared';
import { itemQueryKeys } from './use-item-detail';

interface CreateItemParams {
  projectId: string;
  dto: CreateItemDto;
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, dto }: CreateItemParams) => itemApi.createItem(projectId, dto),
    onSuccess: (_, variables) => {
      // Invalidate project item lists and explorer tree
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['explorer-tree', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId],
      });
    },
  });
}
