import { api } from '../../../lib/api';
import {
  ApiResponse,
  CreateRelationshipDto,
  ImpactAnalysisResult,
  ItemRelationshipSummary,
  RelationshipTypeSummary,
  TraceMatrixResult,
} from '@aljama/shared';

export const traceabilityApi = {
  getProjectRelationshipTypes: async (projectId: string) => {
    const res = await api.get<ApiResponse<RelationshipTypeSummary[]>>(
      `/projects/${projectId}/relationship-types`,
    );
    return res.data.data!;
  },

  getItemRelationships: async (itemId: string) => {
    const res = await api.get<ApiResponse<ItemRelationshipSummary[]>>(
      `/items/${itemId}/relationships`,
    );
    return res.data.data!;
  },

  createRelationship: async (projectId: string, dto: CreateRelationshipDto) => {
    const res = await api.post<ApiResponse<ItemRelationshipSummary>>(
      `/projects/${projectId}/relationships`,
      dto,
    );
    return res.data.data!;
  },

  deleteRelationship: async (id: string) => {
    const res = await api.delete<ApiResponse<{ success: boolean }>>(`/relationships/${id}`);
    return res.data.data!;
  },

  clearSuspect: async (id: string) => {
    const res = await api.patch<ApiResponse<ItemRelationshipSummary>>(
      `/relationships/${id}/clear-suspect`,
    );
    return res.data.data!;
  },

  clearAllSuspectsForItem: async (itemId: string) => {
    const res = await api.patch<ApiResponse<{ clearedCount: number }>>(
      `/items/${itemId}/clear-all-suspects`,
    );
    return res.data.data!;
  },

  getImpactAnalysis: async (itemId: string, upstreamDepth = 2, downstreamDepth = 2) => {
    const res = await api.get<ApiResponse<ImpactAnalysisResult>>(
      `/items/${itemId}/impact-analysis`,
      {
        params: { upstreamDepth, downstreamDepth },
      },
    );
    return res.data.data!;
  },

  getTraceMatrix: async (projectId: string, sourceTypeId?: string, targetTypeId?: string) => {
    const res = await api.get<ApiResponse<TraceMatrixResult>>(
      `/projects/${projectId}/trace-matrix`,
      {
        params: { sourceTypeId, targetTypeId },
      },
    );
    return res.data.data!;
  },

  exportTraceMatrixCsv: async (projectId: string, sourceTypeId?: string, targetTypeId?: string) => {
    const res = await api.get<string>(`/projects/${projectId}/trace-matrix/export`, {
      params: { sourceTypeId, targetTypeId },
      responseType: 'text',
    });
    return res.data;
  },
};
