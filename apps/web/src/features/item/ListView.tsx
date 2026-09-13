import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ItemSummary, PaginatedResult } from '@aljama/shared';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  Lock,
  RotateCcw,
  List,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  Zap,
  BarChart2,
  Layers,
  CheckCircle2,
  Bug,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { CustomizeColumnsModal } from './components/CustomizeColumnsModal';
import { Button } from '../../components/ui/button';
import { BulkActionBar } from './components/bulk-action-bar';
import { BulkUpdateModal } from './components/bulk-update-modal';
import { useProjectMeta } from './hooks/use-project-meta';
import { FilterSidebar } from './components/FilterSidebar';

interface ListViewProps {
  data?: PaginatedResult<ItemSummary> | null;
  isLoading?: boolean;
  page: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string) => void;
  onOpenFilter?: () => void;
  onOpenItem?: (itemId: string, itemKey: string, itemName: string) => void;
  onOpenCreateItem?: (itemTypeId?: string) => void;
  onOpenTraceability?: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  data,
  isLoading,
  page,
  sortBy,
  sortOrder,
  onPageChange,
  onSortChange,
  onOpenFilter,
  onOpenItem,
  onOpenCreateItem,
  onOpenTraceability,
}) => {
  const {
    currentProject,
    setActiveView,
    isFilterSidebarOpen,
    toggleFilterSidebar,
    setFilterSidebarOpen,
    selectedItemId,
    setSelectedItemId,
  } = useProjectStore();
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const { itemTypes, folders, members } = useProjectMeta(currentProject?.id);
  const queryClient = useQueryClient();

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    itemKey: true,
    name: true,
    status: true,
    priority: true,
    assignee: true,
    connectedUsers: true,
    createdDate: false,
    commentsCount: false,
  });

  // Close Add menu on outside click
  React.useEffect(() => {
    if (!isAddMenuOpen) return;
    const handleOutsideClick = () => setIsAddMenuOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isAddMenuOpen]);

  const toggleColumn = (colId: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size > 0) {
      setSelectedRowIds(new Set());
    } else {
      const allIds = items.map(i => i.id);
      setSelectedRowIds(new Set(allIds));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Map real API items directly without mock/dummy fallback data
  const apiItems = data?.items || [];
  const items = apiItems.map(item => ({
    id: item.id,
    itemKey: item.itemKey,
    name: item.name,
    itemTypeId: item.itemTypeId,
    itemTypeKey: item.itemTypeKey,
    status: item.status,
    priority: item.priority,
    isLocked: item.isLocked,
    hasSuspect: item.hasSuspect ?? false,
    connectedUser: item.assignee?.fullName || 'Unassigned',
  }));

  const totalCount = data?.total ?? items.length;
  const totalPages = data?.totalPages ?? 1;

  const renderTypeIcon = (typeKey?: string) => {
    switch (typeKey) {
      case 'SET':
        return (
          <div className="w-4 h-4 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded flex items-center justify-center font-bold text-[9px]">
            S
          </div>
        );
      case 'TXT':
        return (
          <div className="w-4 h-4 bg-slate-100 text-slate-600 border border-slate-300 rounded flex items-center justify-center font-mono font-bold text-[10px]">
            T
          </div>
        );
      case 'REQ':
        return <BarChart2 className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'UC':
        return <Layers className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'TC':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'DEFECT':
        return <Bug className="w-4 h-4 text-red-600 shrink-0" />;
      default:
        return <BarChart2 className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col h-full font-sans text-xs select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0d1117] text-slate-200' : 'bg-white text-slate-800'
      }`}
    >
      {/* 1. Workspace Sub-Header matching Image 3 */}
      <div
        className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 transition-colors duration-200 ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Left: Project Title + Item count + Filter Results link */}
        <div className="flex items-center gap-3">
          <h2
            className={`text-base font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {currentProject?.name || 'Project Workspace'}
          </h2>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalCount} items
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['items'] })}
            title="Refresh items"
            className="p-1.5 h-7"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* View Switcher: List [☰] vs Reading [📄] with highlight frame matching Image 3 & 4 */}
          <div className="flex items-center border-2 border-rose-300/80 rounded bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="p-1 rounded bg-slate-200 text-slate-800 shadow-2xs font-semibold"
              title="List View (Image 3)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('reading')}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Reading View (Image 4)"
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

          {/* Gear settings dropdown matching Image 3 */}
          <Button
            type="button"
            variant="jama"
            size="sm"
            onClick={() => setIsCustomizeOpen(true)}
            className="h-7 px-2 gap-1 text-slate-700"
            title="Customize Columns (Image 5)"
          >
            <Settings className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          {/* Export button */}
          <Button
            type="button"
            variant="jama"
            size="sm"
            className="h-7 px-2.5 gap-1 font-semibold text-xs text-slate-700"
          >
            <span>Export</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          {/* Actions button */}
          <Button
            type="button"
            variant="jama"
            size="sm"
            className="h-7 px-2.5 gap-1 font-semibold text-xs text-slate-700"
          >
            <span>Actions</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          {/* Add button */}
          <div className="relative">
            <Button
              type="button"
              variant="jama"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                setIsAddMenuOpen(prev => !prev);
              }}
              className="h-7 px-3 gap-1 font-semibold text-xs text-slate-700"
            >
              <span>Add</span>
              <ChevronDown
                className={`w-2.5 h-2.5 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`}
              />
            </Button>
            {isAddMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-1 w-48 rounded shadow-lg border py-1 z-30 ${
                  isDark
                    ? 'bg-[#161b22] border-[#30363d] text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {itemTypes && itemTypes.length > 0 ? (
                  itemTypes.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenCreateItem?.(t.id);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs transition-colors ${
                        isDark
                          ? 'hover:bg-[#21262d] text-slate-200'
                          : 'hover:bg-blue-50 text-slate-700'
                      }`}
                    >
                      {renderTypeIcon(t.key)}
                      <span className="truncate">Add {t.name}</span>
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      onOpenCreateItem?.();
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs transition-colors ${
                      isDark
                        ? 'hover:bg-[#21262d] text-slate-200'
                        : 'hover:bg-blue-50 text-slate-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content: Filter Sidebar on Left + Spreadsheet Table & Pagination on Right */}
      <div className="flex-1 flex overflow-hidden">
        {isFilterSidebarOpen && (
          <FilterSidebar
            projectId={currentProject?.id || ''}
            items={items}
            onClose={() => setFilterSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Spreadsheet Table matching Image 3 */}
          <div className="flex-1 overflow-auto relative">
            <table className="w-full text-left border-collapse font-sans text-xs">
              {/* Table Header: Dark gray background #808080 or #8b929a matching Jama Connect */}
              <thead
                className={`sticky top-0 font-bold z-10 select-none ${
                  isDark
                    ? 'bg-[#21262d] text-slate-200 border-b border-[#30363d]'
                    : 'bg-[#8c949e] text-white'
                }`}
              >
                <tr>
                  {/* Checkbox */}
                  <th
                    className={`py-2 px-2.5 w-8 text-center border-r ${isDark ? 'border-[#30363d]' : 'border-slate-400/40'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRowIds.size > 0 && selectedRowIds.size === items.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-400 text-blue-600 focus:ring-0 h-3.5 w-3.5"
                    />
                  </th>

                  {/* Suspect Flag Column ($ / lightning) */}
                  <th
                    className={`py-2 px-2 w-8 text-center border-r ${isDark ? 'border-[#30363d]' : 'border-slate-400/40'}`}
                    title="Suspect Link Indicator"
                  >
                    <Zap className="w-3.5 h-3.5 mx-auto" />
                  </th>

                  {/* Lock Column */}
                  <th
                    className={`py-2 px-2 w-8 text-center border-r ${isDark ? 'border-[#30363d]' : 'border-slate-400/40'}`}
                    title="Item Locked (QT-01)"
                  >
                    <Lock className="w-3.5 h-3.5 mx-auto" />
                  </th>

                  {/* ID Column */}
                  {visibleColumns.itemKey && (
                    <th
                      onClick={() => onSortChange('itemKey')}
                      className={`py-2 px-3 w-32 border-r cursor-pointer ${
                        isDark
                          ? 'border-[#30363d] hover:bg-[#282e38]'
                          : 'border-slate-400/40 hover:bg-slate-600/30'
                      }`}
                    >
                      ID
                    </th>
                  )}

                  {/* Name Column */}
                  {visibleColumns.name && (
                    <th
                      onClick={() => onSortChange('name')}
                      className={`py-2 px-3 border-r cursor-pointer ${
                        isDark
                          ? 'border-[#30363d] hover:bg-[#282e38]'
                          : 'border-slate-400/40 hover:bg-slate-600/30'
                      }`}
                    >
                      Name
                    </th>
                  )}

                  {/* Optional Status Column */}
                  {visibleColumns.status && (
                    <th
                      className={`py-2 px-3 w-28 border-r ${isDark ? 'border-[#30363d]' : 'border-slate-400/40'}`}
                    >
                      Status
                    </th>
                  )}

                  {/* Optional Priority Column */}
                  {visibleColumns.priority && (
                    <th
                      className={`py-2 px-3 w-24 border-r ${isDark ? 'border-[#30363d]' : 'border-slate-400/40'}`}
                    >
                      Priority
                    </th>
                  )}

                  {/* Optional Assignee Column */}
                  {visibleColumns.assignee && (
                    <th
                      className={`py-2 px-3 w-36 border-r ${isDark ? 'border-[#30363d]' : 'border-slate-400/40'}`}
                    >
                      Assignee
                    </th>
                  )}

                  {/* Connected Users Column matching Image 3 */}
                  <th className="py-2 px-3 w-16 text-center" title="Connected Users">
                    <Users className="w-4 h-4 mx-auto" />
                  </th>
                </tr>
              </thead>

              {/* Table Rows matching Image 3 */}
              <tbody
                className={`divide-y transition-colors ${
                  isDark ? 'bg-[#0d1117] divide-[#30363d]' : 'bg-white divide-slate-200'
                }`}
              >
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                      <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                      Loading project items...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                          No items found
                        </span>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {currentProject
                            ? 'This project or folder does not have any matching items. Use "+ Add" to create one.'
                            : 'Please select a project to view its requirements.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const isSelected = selectedRowIds.has(item.id) || selectedItemId === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                        onDoubleClick={() =>
                          onOpenItem && onOpenItem(item.id, item.itemKey, item.name)
                        }
                        className={`cursor-pointer transition-colors border-b ${
                          isSelected
                            ? isDark
                              ? 'bg-[#1f3a5f] text-white'
                              : 'bg-[#e7f3ff]'
                            : isDark
                              ? 'hover:bg-[#161b22] text-slate-300 border-[#21262d]'
                              : 'hover:bg-[#f3f7fb] border-slate-100'
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="py-2 px-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRowIds.has(item.id)}
                            onClick={e => handleToggleRow(item.id, e)}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
                          />
                        </td>

                        {/* Suspect Flag */}
                        <td className="py-2 px-2 text-center">
                          {item.hasSuspect ? (
                            <span title="Suspect link detected (QT-02)">
                              <Zap className="w-3.5 h-3.5 text-amber-500 mx-auto fill-amber-400" />
                            </span>
                          ) : null}
                        </td>

                        {/* Lock status */}
                        <td className="py-2 px-2 text-center">
                          {item.isLocked ? (
                            <span title="Locked for editing (QT-01)">
                              <Lock className="w-3.5 h-3.5 text-amber-600 mx-auto" />
                            </span>
                          ) : null}
                        </td>

                        {/* ID with Type Icon */}
                        {visibleColumns.itemKey && (
                          <td className="py-2 px-3 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {renderTypeIcon(item.itemTypeKey)}
                              <span
                                onClick={e => {
                                  e.stopPropagation();
                                  if (onOpenItem) onOpenItem(item.id, item.itemKey, item.name);
                                }}
                                className="text-[#0088cc] hover:underline font-bold cursor-pointer"
                              >
                                {item.itemKey}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Name */}
                        {visibleColumns.name && (
                          <td
                            className={`py-2 px-3 truncate max-w-md font-normal ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {item.name}
                          </td>
                        )}

                        {/* Status */}
                        {visibleColumns.status && (
                          <td
                            className={`py-2 px-3 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                          >
                            {item.status}
                          </td>
                        )}

                        {/* Priority */}
                        {visibleColumns.priority && (
                          <td
                            className={`py-2 px-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                          >
                            {item.priority}
                          </td>
                        )}

                        {/* Assignee */}
                        {visibleColumns.assignee && (
                          <td
                            className={`py-2 px-3 truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                          >
                            {item.connectedUser || 'Unassigned'}
                          </td>
                        )}

                        {/* Connected Users Silhouette icon matching Image 3 */}
                        <td className="py-2 px-3 text-center">
                          <div
                            className="flex items-center justify-center text-cyan-500"
                            title="Connected Users"
                          >
                            <User className="w-3.5 h-3.5" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div
            className={`shrink-0 h-10 border-t px-4 flex items-center justify-between text-xs select-none transition-colors ${
              isDark
                ? 'bg-[#161b22] border-[#30363d] text-slate-300'
                : 'bg-[#f6f8fa] border-slate-200 text-slate-700'
            }`}
          >
            {/* Left: Item count & range */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>
                Showing{' '}
                <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                  {items.length > 0 ? (page - 1) * 20 + 1 : 0}
                </strong>{' '}
                -{' '}
                <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                  {Math.min(page * 20, totalCount)}
                </strong>{' '}
                of{' '}
                <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                  {totalCount}
                </strong>{' '}
                items
              </span>
            </div>

            {/* Right: Controls matching Image 3 & 4 */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(1)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`}
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className={isDark ? 'px-1 text-slate-400' : 'px-1 text-slate-600'}>Page</span>
              <input
                type="text"
                readOnly
                value={page}
                className={`w-8 text-center rounded py-0.5 text-xs font-semibold border ${
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
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`}
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(totalPages)}
                className={`p-1 disabled:opacity-30 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`}
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customize Columns Modal matching Image 5 */}
      <CustomizeColumnsModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onSelectAll={() => {}}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedRowIds.size}
        onOpenBulkEdit={() => setIsBulkModalOpen(true)}
        onClearSelection={() => setSelectedRowIds(new Set())}
      />

      {/* Bulk Update Modal */}
      {currentProject && (
        <BulkUpdateModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          projectId={currentProject.id}
          selectedItemIds={Array.from(selectedRowIds)}
          folders={folders}
          members={members}
          onComplete={() => setSelectedRowIds(new Set())}
        />
      )}
    </div>
  );
};
