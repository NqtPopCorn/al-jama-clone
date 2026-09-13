import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { CreateItemDto, ExplorerNode, ItemSummary, PaginatedResult } from '@aljama/shared';
import { itemQueryKeys } from './use-item-detail';

interface CreateItemParams {
  projectId: string;
  dto: CreateItemDto;
}

function addItemToTree(
  tree: ExplorerNode[],
  newNode: ExplorerNode,
  folderId?: string | null,
): ExplorerNode[] {
  if (!folderId) {
    return [...tree, newNode];
  }
  return tree.map(node => {
    if (node.id === folderId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addItemToTree(node.children, newNode, folderId),
      };
    }
    return node;
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, dto }: CreateItemParams) => itemApi.createItem(projectId, dto),

    onMutate: async ({ projectId, dto }) => {
      // 1. Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['explorer-tree', projectId] });
      await queryClient.cancelQueries({ queryKey: ['items', projectId] });
      await queryClient.cancelQueries({ queryKey: itemQueryKeys.lists() });

      // 2. Snapshot previous values for rollback
      const previousTree = queryClient.getQueryData<ExplorerNode[]>(['explorer-tree', projectId]);

      const tempId = `temp-item-${Date.now()}`;
      const optimisticNode: ExplorerNode = {
        id: tempId,
        key: 'ITEM',
        name: dto.name,
        type: 'item',
        status: dto.status || 'Draft',
        priority: dto.priority || 'Medium',
        parentId: dto.folderId || null,
        orderIndex: 0,
      };

      // 3. Optimistically update explorer-tree
      if (previousTree) {
        queryClient.setQueryData<ExplorerNode[]>(
          ['explorer-tree', projectId],
          addItemToTree(previousTree, optimisticNode, dto.folderId),
        );
      }

      // 4. Optimistically update items list queries
      queryClient.setQueriesData<PaginatedResult<ItemSummary>>(
        { queryKey: ['items', projectId] },
        oldData => {
          if (!oldData || !oldData.items) return oldData;
          const optimisticItem: ItemSummary = {
            id: tempId,
            projectId,
            folderId: dto.folderId || null,
            itemTypeId: dto.itemTypeId,
            itemTypeKey: 'REQ',
            itemTypeName: 'Item',
            itemKey: 'ITEM',
            name: dto.name,
            description: dto.description || null,
            status: dto.status || 'Draft',
            priority: dto.priority || 'Medium',
            currentVersion: 1,
            isLocked: false,
            hasSuspect: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            ...oldData,
            total: (oldData.total ?? 0) + 1,
            items: [optimisticItem, ...oldData.items],
          };
        },
      );

      return { previousTree, tempId };
    },

    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousTree) {
        queryClient.setQueryData(['explorer-tree', variables.projectId], context.previousTree);
      }
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate project item lists, explorer tree, and project details to synchronize
      queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ['items', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['explorer-tree', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['reading-view', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project', variables.projectId],
      });
    },
  });
}
