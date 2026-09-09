import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { UpdateItemDto } from '@aljama/shared';
import { itemQueryKeys } from './use-item-detail';

interface UpdateItemParams {
  itemId: string;
  projectId: string;
  dto: UpdateItemDto;
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, dto }: UpdateItemParams) => itemApi.updateItem(itemId, dto),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(itemQueryKeys.detail(variables.itemId), data);
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.versions(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: ['explorer-tree', variables.projectId] });
    },
  });
}
