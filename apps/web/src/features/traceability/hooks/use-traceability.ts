import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { traceabilityApi } from '../api/traceability.api';
import { CreateRelationshipDto } from '@aljama/shared';

export const traceabilityKeys = {
  all: ['traceability'] as const,
  relationshipTypes: (projectId: string) =>
    [...traceabilityKeys.all, 'relationship-types', projectId] as const,
  itemRelationships: (itemId: string) =>
    [...traceabilityKeys.all, 'relationships', itemId] as const,
  impactAnalysis: (itemId: string, upstreamDepth: number, downstreamDepth: number) =>
    [...traceabilityKeys.all, 'impact-analysis', itemId, upstreamDepth, downstreamDepth] as const,
  traceMatrix: (projectId: string, sourceTypeId?: string, targetTypeId?: string) =>
    [...traceabilityKeys.all, 'trace-matrix', projectId, sourceTypeId, targetTypeId] as const,
};

export function useItemRelationships(itemId?: string | null) {
  return useQuery({
    queryKey: traceabilityKeys.itemRelationships(itemId || ''),
    queryFn: () => traceabilityApi.getItemRelationships(itemId!),
    enabled: !!itemId,
  });
}

export function useProjectRelationshipTypes(projectId?: string | null) {
  return useQuery({
    queryKey: traceabilityKeys.relationshipTypes(projectId || ''),
    queryFn: () => traceabilityApi.getProjectRelationshipTypes(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateRelationship(projectId: string, currentItemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateRelationshipDto) => traceabilityApi.createRelationship(projectId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: traceabilityKeys.itemRelationships(currentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: traceabilityKeys.itemRelationships(variables.upstreamItemId),
      });
      queryClient.invalidateQueries({
        queryKey: traceabilityKeys.itemRelationships(variables.downstreamItemId),
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useDeleteRelationship(currentItemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => traceabilityApi.deleteRelationship(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: traceabilityKeys.itemRelationships(currentItemId),
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useClearSuspect(currentItemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => traceabilityApi.clearSuspect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: traceabilityKeys.itemRelationships(currentItemId),
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useClearAllSuspects(currentItemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => traceabilityApi.clearAllSuspectsForItem(currentItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: traceabilityKeys.itemRelationships(currentItemId),
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: traceabilityKeys.all });
    },
  });
}

export function useImpactAnalysis(
  itemId?: string | null,
  upstreamDepth = 2,
  downstreamDepth = 2,
  enabled = true,
) {
  return useQuery({
    queryKey: traceabilityKeys.impactAnalysis(itemId || '', upstreamDepth, downstreamDepth),
    queryFn: () => traceabilityApi.getImpactAnalysis(itemId!, upstreamDepth, downstreamDepth),
    enabled: !!itemId && enabled,
  });
}

export function useTraceMatrix(
  projectId?: string | null,
  sourceTypeId?: string,
  targetTypeId?: string,
) {
  return useQuery({
    queryKey: traceabilityKeys.traceMatrix(projectId || '', sourceTypeId, targetTypeId),
    queryFn: () => traceabilityApi.getTraceMatrix(projectId!, sourceTypeId, targetTypeId),
    enabled: !!projectId,
  });
}
