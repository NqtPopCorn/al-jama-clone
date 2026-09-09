import React, { useState, useEffect } from 'react';
import { useTraceMatrix } from '../hooks/use-traceability';
import { useProjectMeta } from '../../item/hooks/use-project-meta';
import { ItemTypeWithFields } from '@aljama/shared';
import { Button } from '../../../components/ui/button';
import { Download, Layers, Zap, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { traceabilityApi } from '../api/traceability.api';
import { RelateItemModal } from './relate-item-modal';

interface TraceViewProps {
  projectId: string;
  onNavigateToItem?: (itemId: string) => void;
}

export const TraceView: React.FC<TraceViewProps> = ({ projectId, onNavigateToItem }) => {
  const { itemTypes = [] } = useProjectMeta(projectId);

  const [sourceTypeId, setSourceTypeId] = useState<string>('');
  const [targetTypeId, setTargetTypeId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Modal for adding missing relationship
  const [relateTargetItem, setRelateTargetItem] = useState<{
    id: string;
    itemKey: string;
    name: string;
  } | null>(null);

  // Set default source & target types when itemTypes load
  useEffect(() => {
    if (itemTypes.length > 0) {
      if (!sourceTypeId) {
        setSourceTypeId(itemTypes[0].id);
      }
      if (!targetTypeId) {
        const target =
          itemTypes.find((t: ItemTypeWithFields) => t.id !== itemTypes[0].id) || itemTypes[0];
        setTargetTypeId(target.id);
      }
    }
  }, [itemTypes, sourceTypeId, targetTypeId]);

  const { data: matrix, isLoading } = useTraceMatrix(
    projectId,
    sourceTypeId || undefined,
    targetTypeId || undefined,
  );

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const csvText = await traceabilityApi.exportTraceMatrixCsv(
        projectId,
        sourceTypeId || undefined,
        targetTypeId || undefined,
      );

      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `trace-matrix-${matrix?.sourceType.key || 'source'}-to-${matrix?.targetType.key || 'target'}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export trace matrix CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0d1117] text-slate-800 dark:text-slate-100">
      {/* 1. Header Toolbar */}
      <div className="px-5 py-3 border-b border-slate-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Traceability Matrix
            </h1>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">|</span>

          {/* Source & Target Type Selectors */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Source:</span>
              <select
                value={sourceTypeId}
                onChange={e => setSourceTypeId(e.target.value)}
                className="h-8 px-2.5 border rounded-md bg-white dark:bg-[#0d1117] border-slate-300 dark:border-[#30363d] font-semibold text-xs"
              >
                {itemTypes.map((t: ItemTypeWithFields) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={() => {
                const temp = sourceTypeId;
                setSourceTypeId(targetTypeId);
                setTargetTypeId(temp);
              }}
              className="px-1.5 py-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-[#21262d] rounded transition-colors"
              title="Swap Source and Target types (Forward / Backward Traceability)"
            >
              ⇄
            </button>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Target:</span>
              <select
                value={targetTypeId}
                onChange={e => setTargetTypeId(e.target.value)}
                className="h-8 px-2.5 border rounded-md bg-white dark:bg-[#0d1117] border-slate-300 dark:border-[#30363d] font-semibold text-xs"
              >
                {itemTypes.map((t: ItemTypeWithFields) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.key})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Export CSV Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting || isLoading}
            className="h-8 px-3 text-xs font-semibold gap-1.5 bg-white dark:bg-[#21262d] border-slate-300 dark:border-[#30363d]"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Coverage Stats Bar */}
      {matrix && (
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">Source Items:</span>{' '}
              <strong className="font-bold text-slate-800 dark:text-slate-100">
                {matrix.totalSourceItems}
              </strong>
            </div>

            <div>
              <span className="text-slate-500">Covered:</span>{' '}
              <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                {matrix.coveredItemsCount}
              </strong>
            </div>

            <div>
              <span className="text-slate-500">Missing Coverage:</span>{' '}
              <strong className="font-bold text-amber-600 dark:text-amber-400">
                {matrix.totalSourceItems - matrix.coveredItemsCount}
              </strong>
            </div>

            {/* Coverage Progress Pill */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Coverage:</span>
              <div className="w-32 h-2.5 bg-slate-200 dark:bg-[#30363d] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${matrix.coveragePercentage}%` }}
                  className={`h-full transition-all duration-300 ${
                    matrix.coveragePercentage >= 80
                      ? 'bg-emerald-500'
                      : matrix.coveragePercentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
              </div>
              <span className="font-bold text-xs">{matrix.coveragePercentage}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Covered
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Missing Link
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Suspect Flag
            </span>
          </div>
        </div>
      )}

      {/* 3. Traceability Grid Table */}
      <div className="flex-1 overflow-auto p-5">
        <div className="bg-white dark:bg-[#161b22] rounded-lg border border-slate-200 dark:border-[#30363d] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 dark:bg-[#21262d] font-bold border-b border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-slate-300 select-none">
              <tr>
                <th className="py-2.5 px-4 w-48 border-r border-slate-200 dark:border-[#30363d]">
                  {matrix?.sourceType.name || 'Source Item'} Key
                </th>
                <th className="py-2.5 px-4 border-r border-slate-200 dark:border-[#30363d]">
                  Name / Specification
                </th>
                <th className="py-2.5 px-4 w-28 border-r border-slate-200 dark:border-[#30363d] text-center">
                  Coverage
                </th>
                <th className="py-2.5 px-4">Linked {matrix?.targetType.name || 'Target Items'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 text-xs">
                    Loading traceability matrix...
                  </td>
                </tr>
              ) : !matrix || matrix.rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 text-xs">
                    No items found for source type {matrix?.sourceType.name}.
                  </td>
                </tr>
              ) : (
                matrix.rows.map(row => (
                  <tr
                    key={row.sourceItem.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#1c2128] transition-colors"
                  >
                    {/* Source Key */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-[#30363d] align-top">
                      <div className="flex items-center gap-1.5">
                        <span
                          onClick={() => onNavigateToItem?.(row.sourceItem.id)}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          {row.sourceItem.itemKey}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {row.sourceItem.status || 'Active'}
                      </span>
                    </td>

                    {/* Source Name */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-[#30363d] align-top font-medium text-slate-700 dark:text-slate-200">
                      {row.sourceItem.name}
                    </td>

                    {/* Coverage Status Badge */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-[#30363d] align-top text-center">
                      {row.isCovered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Covered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Missing Link
                        </span>
                      )}
                    </td>

                    {/* Linked Targets */}
                    <td className="py-3 px-4 align-top">
                      {row.linkedItems.length === 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 italic text-xs">
                            No linked {matrix.targetType.name}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setRelateTargetItem({
                                id: row.sourceItem.id,
                                itemKey: row.sourceItem.itemKey,
                                name: row.sourceItem.name,
                              })
                            }
                            className="h-6 px-2 text-[11px] font-medium gap-1 text-blue-600 dark:text-blue-400 border-dashed"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Link {matrix.targetType.name}</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {row.linkedItems.map(target => (
                            <div
                              key={target.relationshipId}
                              className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                                target.isSuspect
                                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                                  : 'bg-slate-50/50 dark:bg-[#1e242d] border-slate-200 dark:border-[#30363d]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {target.direction && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                      target.direction === 'upstream'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300'
                                    }`}
                                    title={
                                      target.direction === 'upstream'
                                        ? 'Upstream parent'
                                        : 'Downstream dependent'
                                    }
                                  >
                                    {target.direction === 'upstream' ? '↑ UP' : '↓ DOWN'}
                                  </span>
                                )}

                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                    target.isRequired
                                      ? 'border border-solid border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                      : 'border border-dashed border-slate-300 text-slate-600 dark:text-slate-300'
                                  }`}
                                  title={target.isRequired ? 'Required link' : 'Optional link'}
                                >
                                  {target.relationshipTypeName}
                                </span>

                                <span
                                  onClick={() => onNavigateToItem?.(target.item.id)}
                                  className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                                >
                                  {target.item.itemKey}
                                </span>

                                <span className="text-slate-700 dark:text-slate-300 truncate">
                                  {target.item.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {target.isSuspect && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-400">
                                    <Zap className="w-2.5 h-2.5 fill-amber-600" />
                                    SUSPECT
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  {target.item.status || 'Active'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relate Item Modal */}
      {relateTargetItem && (
        <RelateItemModal
          isOpen={!!relateTargetItem}
          onClose={() => setRelateTargetItem(null)}
          projectId={projectId}
          currentItem={relateTargetItem}
        />
      )}
    </div>
  );
};
