import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../../item/api/item.api';
import { CreateFolderDto, ExplorerNode, FolderSummary } from '@aljama/shared';
import { itemQueryKeys } from '../../item/hooks/use-item-detail';

interface CreateFolderParams {
  projectId: string;
  dto: CreateFolderDto;
}

function addFolderToTree(
  tree: ExplorerNode[],
  newNode: ExplorerNode,
  parentId?: string | null,
): ExplorerNode[] {
  if (!parentId) {
    return [...tree, newNode];
  }
  return tree.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addFolderToTree(node.children, newNode, parentId),
      };
    }
    return node;
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, dto }: CreateFolderParams) => itemApi.createFolder(projectId, dto),

    onMutate: async ({ projectId, dto }) => {
      // 1. Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['explorer-tree', projectId] });
      await queryClient.cancelQueries({ queryKey: ['project-folders', projectId] });
      await queryClient.cancelQueries({ queryKey: itemQueryKeys.folders(projectId) });

      // 2. Snapshot previous values for rollback
      const previousTree = queryClient.getQueryData<ExplorerNode[]>(['explorer-tree', projectId]);
      const previousFolders = queryClient.getQueryData<FolderSummary[]>([
        'project-folders',
        projectId,
      ]);
      const previousMetaFolders = queryClient.getQueryData<FolderSummary[]>(
        itemQueryKeys.folders(projectId),
      );

      const tempId = `temp-folder-${Date.now()}`;
      const optimisticNode: ExplorerNode = {
        id: tempId,
        name: dto.name,
        type: 'folder',
        parentId: dto.parentFolderId || null,
        orderIndex: dto.orderIndex ?? 999,
        children: [],
      };

      const optimisticFolderSummary: FolderSummary = {
        id: tempId,
        name: dto.name,
        parentFolderId: dto.parentFolderId || null,
        orderIndex: dto.orderIndex ?? 999,
      };

      // 3. Optimistically update explorer-tree
      if (previousTree) {
        queryClient.setQueryData<ExplorerNode[]>(
          ['explorer-tree', projectId],
          addFolderToTree(previousTree, optimisticNode, dto.parentFolderId),
        );
      }

      // 4. Optimistically update folders list
      if (previousFolders) {
        queryClient.setQueryData<FolderSummary[]>(
          ['project-folders', projectId],
          [...previousFolders, optimisticFolderSummary],
        );
      }
      if (previousMetaFolders) {
        queryClient.setQueryData<FolderSummary[]>(itemQueryKeys.folders(projectId), [
          ...previousMetaFolders,
          optimisticFolderSummary,
        ]);
      }

      return { previousTree, previousFolders, previousMetaFolders, tempId };
    },

    onError: (_err, variables, context) => {
      // Rollback to snapshots on error
      if (context?.previousTree) {
        queryClient.setQueryData(['explorer-tree', variables.projectId], context.previousTree);
      }
      if (context?.previousFolders) {
        queryClient.setQueryData(['project-folders', variables.projectId], context.previousFolders);
      }
      if (context?.previousMetaFolders) {
        queryClient.setQueryData(
          itemQueryKeys.folders(variables.projectId),
          context.previousMetaFolders,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate queries to synchronize with server state
      queryClient.invalidateQueries({
        queryKey: ['explorer-tree', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-folders', variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: itemQueryKeys.folders(variables.projectId),
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
