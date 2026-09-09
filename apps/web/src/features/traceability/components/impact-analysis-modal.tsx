import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { useImpactAnalysis } from '../hooks/use-traceability';
import { useThemeStore } from '../../../stores/theme.store';
import {
  Network,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  RefreshCw,
  Zap,
  X,
} from 'lucide-react';
import { ImpactAnalysisNode } from '@aljama/shared';

interface ImpactAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemKey: string;
  itemName: string;
  onNavigateToItem?: (itemId: string) => void;
}

export const ImpactAnalysisModal: React.FC<ImpactAnalysisModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemKey,
  itemName,
  onNavigateToItem,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const [upstreamDepth, setUpstreamDepth] = useState<number>(2);
  const [downstreamDepth, setDownstreamDepth] = useState<number>(2);

  const { data, isLoading, refetch } = useImpactAnalysis(
    isOpen ? itemId : null,
    upstreamDepth,
    downstreamDepth,
    isOpen,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100 select-none">
      <div
        className={`w-full max-w-4xl max-h-[88vh] rounded-md shadow-2xl border flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 ${
          isDark
            ? 'bg-[#1c2128] border-[#30363d] text-slate-200'
            : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* Header with Depth Controls */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b select-none shrink-0 ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#333333] text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Network className="w-4 h-4 text-purple-400" />
            <span>Impact Analysis & Traceability Graph: {itemKey}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Depth Controls */}
            <div className="flex items-center gap-2 text-xs">
              <span className="opacity-80 font-medium">Upstream:</span>
              <select
                value={upstreamDepth}
                onChange={e => setUpstreamDepth(parseInt(e.target.value, 10))}
                className="h-6 px-1.5 border rounded bg-white text-slate-800 dark:bg-[#0d1117] dark:text-slate-200 border-slate-300 dark:border-[#30363d] text-xs font-semibold"
              >
                {[1, 2, 3, 4, 5].map(d => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? 'lvl' : 'lvls'}
                  </option>
                ))}
              </select>

              <span className="opacity-80 font-medium ml-1">Downstream:</span>
              <select
                value={downstreamDepth}
                onChange={e => setDownstreamDepth(parseInt(e.target.value, 10))}
                className="h-6 px-1.5 border rounded bg-white text-slate-800 dark:bg-[#0d1117] dark:text-slate-200 border-slate-300 dark:border-[#30363d] text-xs font-semibold"
              >
                {[1, 2, 3, 4, 5].map(d => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? 'lvl' : 'lvls'}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="h-6 w-6 p-0 hover:bg-white/20 text-white opacity-80 hover:opacity-100"
                title="Refresh Graph"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-white/20 transition-colors opacity-70 hover:opacity-100 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-slate-600 dark:text-slate-400">
              Total Impacted Items:{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {data?.totalImpactedCount ?? 0}
              </strong>
            </span>

            {(data?.suspectCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 rounded border border-amber-300 dark:border-amber-800">
                <Zap className="w-3 h-3 fill-amber-500" />
                {data?.suspectCount} Suspect Flag{data?.suspectCount === 1 ? '' : 's'} Detected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Trace Links Clean (No Suspect Flags)
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            QT-02 Rule: Suspect propagates strictly 1 level downstream on change
          </div>
        </div>

        {/* Graph Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Calculating impact graph and traversing relationships...
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1. UPSTREAM SECTION */}
              <div className="border border-slate-200 dark:border-[#30363d] rounded-lg p-3 bg-slate-50/50 dark:bg-[#161b22]/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Upstream Parents & Sources ({data?.upstreamNodes.length ?? 0})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Items this requirement depends on
                  </span>
                </div>

                {data?.upstreamNodes && data.upstreamNodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {data.upstreamNodes.map((node: ImpactAnalysisNode) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        onNavigate={onNavigateToItem}
                        direction="upstream"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 italic">
                    No upstream relationships found within depth {upstreamDepth}.
                  </div>
                )}
              </div>

              {/* 2. ROOT ITEM SECTION */}
              <div className="relative p-3.5 rounded-lg border-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm text-center">
                <div className="inline-block px-2 py-0.5 mb-1 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                  Target Root Item
                </div>
                <div className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
                  {itemKey}
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-lg mx-auto truncate">
                  {itemName}
                </div>
              </div>

              {/* 3. DOWNSTREAM SECTION */}
              <div className="border border-slate-200 dark:border-[#30363d] rounded-lg p-3 bg-slate-50/50 dark:bg-[#161b22]/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    <ArrowDownRight className="w-4 h-4" />
                    <span>
                      Downstream Dependents & Verification ({data?.downstreamNodes.length ?? 0})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Items directly impacted if this requirement changes
                  </span>
                </div>

                {data?.downstreamNodes && data.downstreamNodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {data.downstreamNodes.map((node: ImpactAnalysisNode) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        onNavigate={onNavigateToItem}
                        direction="downstream"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 italic">
                    No downstream dependents found within depth {downstreamDepth}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function NodeCard({
  node,
  onNavigate,
  direction,
}: {
  node: ImpactAnalysisNode;
  onNavigate?: (id: string) => void;
  direction: 'upstream' | 'downstream';
}) {
  return (
    <div
      className={`p-2.5 rounded-md border text-xs flex flex-col justify-between transition-all ${
        node.isSuspect
          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-2xs'
          : 'bg-white dark:bg-[#1e242d] border-slate-200 dark:border-[#30363d] hover:border-slate-300'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span
              onClick={() => onNavigate?.(node.id)}
              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
            >
              {node.itemKey}
            </span>
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-[#30363d] text-[10px] text-slate-600 dark:text-slate-300 rounded shrink-0">
              {node.itemTypeName}
            </span>
            <span className="text-[10px] text-slate-400">L{node.depth}</span>
          </div>

          {node.isSuspect ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 rounded border border-amber-400 dark:border-amber-700 shrink-0">
              <Zap className="w-2.5 h-2.5 fill-amber-600" />
              SUSPECT
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">{node.status || 'Active'}</span>
          )}
        </div>

        <div className="font-medium text-slate-700 dark:text-slate-200 line-clamp-1">
          {node.name}
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#30363d] flex items-center justify-between text-[11px] text-slate-500">
        <span className="italic">
          {direction === 'upstream' ? 'Verified by / Source of' : 'Relates / Depend via'}:{' '}
          <strong className="font-semibold text-slate-700 dark:text-slate-300">
            {node.relationshipPhrase}
          </strong>
        </span>

        {node.isSuspect && node.suspectReason && (
          <span
            className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate max-w-[150px]"
            title={node.suspectReason}
          >
            {node.suspectReason}
          </span>
        )}
      </div>
    </div>
  );
}
