import { useQuery } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { itemQueryKeys } from './use-item-detail';

export function useProjectMeta(projectId?: string | null) {
  const itemTypesQuery = useQuery({
    queryKey: itemQueryKeys.types(projectId || ''),
    queryFn: () => itemApi.getItemTypes(projectId!),
    enabled: !!projectId,
  });

  const membersQuery = useQuery({
    queryKey: itemQueryKeys.members(projectId || ''),
    queryFn: () => itemApi.getProjectMembers(projectId!),
    enabled: !!projectId,
  });

  const foldersQuery = useQuery({
    queryKey: itemQueryKeys.folders(projectId || ''),
    queryFn: () => itemApi.getProjectFolders(projectId!),
    enabled: !!projectId,
  });

  return {
    itemTypes: itemTypesQuery.data || [],
    isLoadingTypes: itemTypesQuery.isLoading,
    members: membersQuery.data || [],
    isLoadingMembers: membersQuery.isLoading,
    folders: foldersQuery.data || [],
    isLoadingFolders: foldersQuery.isLoading,
  };
}
