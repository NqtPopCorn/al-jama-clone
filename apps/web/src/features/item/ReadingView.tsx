import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  RotateCcw,
  List,
  FileText,
  Layers,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  BadgeAlert,
  User,
} from 'lucide-react';
import { CustomizeColumnsModal } from './components/CustomizeColumnsModal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { FilterSidebar } from './components/FilterSidebar';

export interface ReadingItem {
  id: string;
  itemKey: string;
  name: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  folder?: { id: string; name: string } | null;
  itemType?: { key: string; name: string; icon?: string | null };
  assignee?: { id: string; fullName: string; avatarUrl?: string | null } | null;
  customFields?: Record<string, unknown> | null;
  currentVersion?: number;
  updatedAt?: string;
}

interface ReadingViewProps {
  items?: ReadingItem[];
  isLoading?: boolean;
  onOpenFilter?: () => void;
  onOpenItem?: (itemId: string, itemKey: string, itemName: string) => void;
  onOpenTraceability?: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  items: propItems = [],
  isLoading,
  onOpenFilter,
  onOpenItem,
  onOpenTraceability,
}) => {
  const {
    currentProject,
    setActiveView,
    isFilterSidebarOpen,
    toggleFilterSidebar,
    setFilterSidebarOpen,
  } = useProjectStore();
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';
  const queryClient = useQueryClient();

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalItems = propItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pagedItems = propItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
      className={`flex-1 flex flex-col h-full font-sans text-xs select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0d1117] text-slate-200' : 'bg-white text-slate-800'
      }`}
    >
      {/* 1. Workspace Sub-Header */}
      <div
        className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 transition-colors duration-200 ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Left: Project Title + Real Item count + Filter Results link */}
        <div className="flex items-center gap-3">
          <h2
            className={`text-base font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {currentProject?.name || 'Project Workspace'}
          </h2>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
          <button
            type="button"
            onClick={toggleFilterSidebar}
            className="flex items-center gap-1 text-xs text-[#0088cc] hover:underline font-medium cursor-pointer"
          >
            {isFilterSidebarOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>{isFilterSidebarOpen ? 'Hide Filters' : 'Filter Results'}</span>
          </button>
        </div>

        {/* Right: Action Bar (Refresh, View Switcher, Settings Gear, Export, Actions, Add) */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            type="button"
            variant="jama"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['reading-view'] })}
            title="Refresh Reading View"
            className="p-1.5 h-7"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* View Switcher: List [☰] vs Reading [📄] */}
          <div className="flex items-center border-2 border-rose-300/80 rounded bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('reading')}
              className="p-1 rounded bg-slate-200 text-slate-800 shadow-2xs font-semibold"
              title="Reading View"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenTraceability) {
                  onOpenTraceability();
                } else {
                  setActiveView('trace');
                }
              }}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Open Traceability Matrix in new tab (BR-TRACE-06)"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
            </button>
          </div>

          <Button
            type="button"
            variant="jama"
            size="sm"
            onClick={() => setIsCustomizeOpen(true)}
            className="h-7 px-2 gap-1 text-slate-700"
            title="Customize Columns"
          >
            <Settings className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          <Button
            type="button"
            variant="jama"
            size="sm"
            className="h-7 px-2.5 gap-1 font-semibold text-xs text-slate-700"
          >
            <span>Export</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          <Button
            type="button"
            variant="jama"
            size="sm"
            className="h-7 px-2.5 gap-1 font-semibold text-xs text-slate-700"
          >
            <span>Actions</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>

      {/* 2. Main Content: Filter Sidebar on Left + Reading Document on Right */}
      <div className="flex-1 flex overflow-hidden">
        {isFilterSidebarOpen && (
          <FilterSidebar
            projectId={currentProject?.id || ''}
            items={propItems as any}
            onClose={() => setFilterSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Reading View Selection Bar (Gray header with checkbox) */}
          <div
            className={`h-7 border-b flex items-center px-3 gap-2 shrink-0 ${
              isDark
                ? 'bg-[#21262d] border-[#30363d] text-slate-200'
                : 'bg-[#8c949e] border-slate-300 text-white'
            }`}
          >
            <input
              type="checkbox"
              className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
            />
            <span className="text-[11px] font-semibold opacity-90">
              Showing items {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </span>
          </div>

          {/* Document Body with Real Specifications */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full relative">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400 italic">
                Loading reading view specifications...
              </div>
            ) : pagedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                  No items available in Reading View
                </span>
                <p className="text-xs text-slate-400 max-w-sm text-center">
                  {currentProject
                    ? 'No requirements match the current folder or filters.'
                    : 'Please select a project to display its specification document.'}
                </p>
              </div>
            ) : (
              pagedItems.map((item, idx) => {
                const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                const customFieldEntries = Object.entries(item.customFields || {});

                return (
                  <div
                    key={item.id}
                    className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800 last:border-0"
                  >
                    {/* Section Heading with Item Key, Name and Badges */}
                    <div className="flex items-start justify-between gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5 mt-0.5"
                        />
                        <h3
                          className={`text-sm font-bold tracking-tight flex items-center gap-2 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          <span className="text-[#0088cc] font-mono">{itemIndex}.</span>
                          <span
                            onClick={() =>
                              onOpenItem && onOpenItem(item.id, item.itemKey, item.name)
                            }
                            className="text-[#0088cc] hover:underline cursor-pointer font-mono"
                          >
                            {item.itemKey}
                          </span>
                          <span className="font-sans">— {item.name}</span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.itemType && (
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {item.itemType.name}
                          </Badge>
                        )}
                        {item.status && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.status}
                          </Badge>
                        )}
                        {item.priority && (
                          <Badge variant="outline" className="text-[10px]">
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Specification Table */}
                    <div
                      className={`border rounded-xs overflow-hidden shadow-2xs ml-6 ${
                        isDark ? 'border-[#30363d]' : 'border-slate-300'
                      }`}
                    >
                      <table className="w-full border-collapse text-xs">
                        <tbody>
                          {/* Description */}
                          <tr
                            className={
                              isDark ? 'border-b border-[#30363d]' : 'border-b border-slate-300'
                            }
                          >
                            <td
                              className={`w-1/4 p-3 font-semibold border-r align-top leading-snug ${
                                isDark
                                  ? 'bg-[#161b22] text-slate-300 border-[#30363d]'
                                  : 'bg-[#f0f2f5] text-slate-700 border-slate-300'
                              }`}
                            >
                              Description
                            </td>
                            <td
                              className={`w-3/4 p-3 leading-relaxed font-normal ${
                                isDark ? 'bg-[#0d1117] text-slate-300' : 'bg-white text-slate-800'
                              }`}
                            >
                              {item.description ? (
                                <div
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: item.description }}
                                />
                              ) : (
                                <span className="text-slate-400 italic">
                                  No description entered.
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Workflow & Lifecycle Meta */}
                          <tr
                            className={
                              isDark ? 'border-b border-[#30363d]' : 'border-b border-slate-300'
                            }
                          >
                            <td
                              className={`w-1/4 p-3 font-semibold border-r align-top leading-snug ${
                                isDark
                                  ? 'bg-[#161b22] text-slate-300 border-[#30363d]'
                                  : 'bg-[#f0f2f5] text-slate-700 border-slate-300'
                              }`}
                            >
                              Attributes
                            </td>
                            <td
                              className={`w-3/4 p-3 leading-relaxed ${
                                isDark ? 'bg-[#0d1117] text-slate-300' : 'bg-white text-slate-800'
                              }`}
                            >
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div>
                                  <span className="text-slate-400 text-[10px] block uppercase font-medium">
                                    Version
                                  </span>
                                  <span className="font-mono font-semibold">
                                    v{item.currentVersion || 1}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block uppercase font-medium">
                                    Assignee
                                  </span>
                                  <span className="font-medium">
                                    {item.assignee?.fullName || 'Unassigned'}
                                  </span>
                                </div>
                                {item.folder && (
                                  <div>
                                    <span className="text-slate-400 text-[10px] block uppercase font-medium">
                                      Folder
                                    </span>
                                    <span className="font-medium">{item.folder.name}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Custom Fields */}
                          {customFieldEntries.map(([fKey, fVal], cIdx) => (
                            <tr
                              key={fKey}
                              className={
                                cIdx < customFieldEntries.length - 1
                                  ? isDark
                                    ? 'border-b border-[#30363d]'
                                    : 'border-b border-slate-300'
                                  : ''
                              }
                            >
                              <td
                                className={`w-1/4 p-3 font-semibold border-r align-top leading-snug capitalize ${
                                  isDark
                                    ? 'bg-[#161b22] text-slate-300 border-[#30363d]'
                                    : 'bg-[#f0f2f5] text-slate-700 border-slate-300'
                                }`}
                              >
                                {fKey.replace(/_/g, ' ')}
                              </td>
                              <td
                                className={`w-3/4 p-3 leading-relaxed font-normal ${
                                  isDark ? 'bg-[#0d1117] text-slate-300' : 'bg-white text-slate-800'
                                }`}
                              >
                                {typeof fVal === 'string' && fVal.startsWith('<p>') ? (
                                  <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: fVal }}
                                  />
                                ) : (
                                  <span>{String(fVal ?? '—')}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Bottom-Right Pagination Bar */}
          {totalPages > 1 && (
            <div
              className={`absolute right-4 bottom-4 rounded shadow-md px-2 py-1 flex items-center gap-1.5 text-xs z-20 border transition-colors ${
                isDark
                  ? 'bg-[#161b22] border-[#30363d] text-slate-200'
                  : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(1)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(p => p - 1)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className={isDark ? 'px-1 text-slate-400' : 'px-1 text-slate-600'}>Page</span>
              <input
                type="text"
                readOnly
                value={currentPage}
                className={`w-7 text-center rounded py-0.5 text-xs font-semibold border ${
                  isDark
                    ? 'bg-[#0d1117] border-[#30363d] text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <span className={isDark ? 'px-1 text-slate-400' : 'px-1 text-slate-600'}>
                of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(totalPages)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customize Columns Modal */}
      <CustomizeColumnsModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        visibleColumns={{}}
        onToggleColumn={() => {}}
        onSelectAll={() => {}}
      />
    </div>
  );
};
