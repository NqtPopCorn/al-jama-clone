import React from 'react';
import { useCompareVersions } from '../hooks/use-item-versions';
import { Button } from '../../../components/ui/button';
import { X, Columns2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme.store';

interface VersionDiffCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemKey: string;
  version1: number;
  version2: number;
}

export const VersionDiffCanvas: React.FC<VersionDiffCanvasProps> = ({
  isOpen,
  onClose,
  itemId,
  itemKey,
  version1,
  version2,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const {
    data: diff,
    isLoading,
    error,
  } = useCompareVersions(itemId, Math.min(version1, version2), Math.max(version1, version2));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className={`w-full max-w-4xl max-h-[85vh] rounded-md shadow-2xl border flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 ${
          isDark
            ? 'bg-[#1c2128] border-[#30363d] text-slate-200'
            : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* Title Bar */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b select-none ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#333333] text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Columns2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-xs tracking-wide">
              Compare Versions: {itemKey} (v{Math.min(version1, version2)} vs v
              {Math.max(version1, version2)})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legend Toolbar */}
        <div
          className={`px-4 py-2 border-b flex items-center justify-between text-xs select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium">Diff Legend:</span>
            <span className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-[11px] font-medium">
              <span className="line-through">Red strikethrough</span> (Removed)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[11px] font-medium">
              <span>Green highlight</span> (Added)
            </span>
          </div>

          <span className="text-[11px] text-slate-400">Word-level Redline/Greenline compare</span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-sans">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              Calculating revision differences...
            </div>
          ) : error || !diff ? (
            <div className="py-12 text-center text-red-500">Failed to load comparison data.</div>
          ) : (
            <>
              {/* 1. Name Diff */}
              <div className="space-y-1">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Item Name
                </span>
                <div
                  className={`p-2.5 rounded border text-xs leading-relaxed ${
                    diff.nameDiff.changed
                      ? isDark
                        ? 'bg-[#1f2937] border-amber-500/40'
                        : 'bg-amber-50/60 border-amber-200'
                      : isDark
                        ? 'bg-[#161b22] border-[#30363d]'
                        : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {diff.nameDiff.changed ? (
                    <div className="space-y-1">
                      <div>
                        <span className="text-slate-400 text-[10px] mr-2">v{diff.versionA}:</span>
                        <del className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-1 rounded line-through">
                          {diff.nameDiff.old}
                        </del>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] mr-2">v{diff.versionB}:</span>
                        <ins className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1 rounded font-medium">
                          {diff.nameDiff.new}
                        </ins>
                      </div>
                    </div>
                  ) : (
                    <span>{diff.nameDiff.new} (Unchanged)</span>
                  )}
                </div>
              </div>

              {/* 2. Metadata Field Changes Table */}
              <div className="space-y-1">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Attributes & Custom Fields
                </span>
                <div className="border rounded overflow-hidden border-slate-200 dark:border-[#30363d]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead
                      className={`font-semibold border-b ${
                        isDark
                          ? 'bg-[#161b22] border-[#30363d] text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <tr>
                        <th className="py-1.5 px-3 w-40 border-r border-slate-200 dark:border-[#30363d]">
                          Field
                        </th>
                        <th className="py-1.5 px-3 border-r border-slate-200 dark:border-[#30363d]">
                          Version {diff.versionA} (Before)
                        </th>
                        <th className="py-1.5 px-3">Version {diff.versionB} (After)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
                      {diff.fieldDiffs.map(fd => {
                        const isChanged = fd.changed;
                        return (
                          <tr
                            key={fd.fieldKey}
                            className={
                              isChanged
                                ? isDark
                                  ? 'bg-[#1f2937]/50 font-medium'
                                  : 'bg-amber-50/50 font-medium'
                                : ''
                            }
                          >
                            <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-[#30363d]">
                              {fd.fieldName}
                            </td>
                            <td className="py-1.5 px-3 text-slate-500 border-r border-slate-200 dark:border-[#30363d]">
                              {isChanged ? (
                                <del className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-1 rounded line-through">
                                  {String(fd.oldValue ?? 'None')}
                                </del>
                              ) : (
                                String(fd.oldValue ?? 'None')
                              )}
                            </td>
                            <td className="py-1.5 px-3">
                              {isChanged ? (
                                <ins className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1 rounded">
                                  {String(fd.newValue ?? 'None')}
                                </ins>
                              ) : (
                                String(fd.newValue ?? 'None')
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Description Rich Text Diff */}
              <div className="space-y-1">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Description Redline Comparison
                </span>
                <div
                  className={`p-3.5 rounded border min-h-[120px] text-xs leading-relaxed font-sans prose prose-sm max-w-none dark:prose-invert ${
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-white border-slate-300'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html:
                      diff.descriptionDiffHtml ||
                      '<span class="text-slate-400 italic">No description</span>',
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-end p-2.5 border-t select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
          }`}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs px-3"
          >
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
};
