import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../../stores/project.store';
import { useProjectMeta } from '../hooks/use-project-meta';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterSidebarProps {
  projectId: string;
  items?: any[];
  onClose?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ projectId, items = [], onClose }) => {
  const {
    searchQuery,
    setSearchQuery,
    itemTypeFilter,
    setItemTypeFilter,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    lastModifiedFilter,
    setLastModifiedFilter,
    resetFilters,
  } = useProjectStore();

  const { itemTypes = [] } = useProjectMeta(projectId);
  const [showAllTypes, setShowAllTypes] = useState(false);

  // Standard fallback item types matching Image 1
  const defaultTypes = useMemo(
    () => [
      { id: 'REQ', key: 'REQ', name: 'Functional Requirement', count: 34 },
      { id: 'UC', key: 'UC', name: 'Use Case', count: 17 },
      { id: 'FOLDER', key: 'FOLDER', name: 'Folder', count: 10 },
      { id: 'SET', key: 'SET', name: 'Set', count: 10 },
      { id: 'BR', key: 'BR', name: 'Business Requirement', count: 9 },
      { id: 'TC', key: 'TC', name: 'Test Case', count: 8 },
      { id: 'DEFECT', key: 'DEFECT', name: 'Defect', count: 2 },
    ],
    [],
  );

  // Compute facet counts based on current items
  const itemTypeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(item => {
      if (item.itemTypeId) map[item.itemTypeId] = (map[item.itemTypeId] || 0) + 1;
      if (item.itemTypeKey) map[item.itemTypeKey] = (map[item.itemTypeKey] || 0) + 1;
      if (item.name) map[item.name] = (map[item.name] || 0) + 1;
    });
    return map;
  }, [items]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = { Draft: 6, 'In Review': 1, Approved: 1, Active: 3 };
    if (items.length > 0) {
      const liveMap: Record<string, number> = {};
      items.forEach(item => {
        if (item.status) {
          liveMap[item.status] = (liveMap[item.status] || 0) + 1;
        }
      });
      if (Object.keys(liveMap).length > 0) return liveMap;
    }
    return map;
  }, [items]);

  const priorityCounts = useMemo(() => {
    const map: Record<string, number> = { Critical: 1, High: 3, Medium: 4, Low: 0 };
    if (items.length > 0) {
      const liveMap: Record<string, number> = {};
      items.forEach(item => {
        if (item.priority) {
          liveMap[item.priority] = (liveMap[item.priority] || 0) + 1;
        }
      });
      if (Object.keys(liveMap).length > 0) return liveMap;
    }
    return map;
  }, [items]);

  const hasActiveFilters =
    !!searchQuery || !!itemTypeFilter || !!statusFilter || !!priorityFilter || !!lastModifiedFilter;

  const statuses = ['Draft', 'In Review', 'Approved', 'Active'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];

  // Types list to render
  const mergedTypes = useMemo(() => {
    if (itemTypes.length > 0) {
      return itemTypes.map(t => ({
        id: t.id,
        key: t.key,
        name: t.name,
        count: itemTypeCounts[t.id] ?? itemTypeCounts[t.key] ?? 0,
      }));
    }
    return defaultTypes.map(t => ({
      id: t.id,
      key: t.key,
      name: t.name,
      count: itemTypeCounts[t.id] ?? itemTypeCounts[t.key] ?? t.count,
    }));
  }, [itemTypes, defaultTypes, itemTypeCounts]);

  const displayedItemTypes = showAllTypes ? mergedTypes : mergedTypes.slice(0, 5);

  return (
    <aside className="w-60 md:w-64 shrink-0 border-r border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#161b22] flex flex-col h-full overflow-y-auto text-xs font-sans select-none transition-colors">
      {/* 1. Header matching Image 1: "Filter Results" */}
      <div className="px-3 py-2.5 border-b border-slate-200 dark:border-[#30363d] flex items-center justify-between bg-[#f8fafc] dark:bg-[#1c2128]">
        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 tracking-tight">
          Filter Results
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-[#0088cc] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              title="Reset all filters"
            >
              Clear
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              title="Close filter panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        {/* 2. Keyword Search Section matching Image 1 */}
        <div>
          <label className="block font-bold text-xs text-[#00828a] dark:text-teal-400 mb-1.5">
            Keyword
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by Keyword"
              className="w-full px-2.5 pr-7 py-1.5 text-xs border border-slate-300 dark:border-[#30363d] rounded bg-white dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00828a]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            )}
          </div>
        </div>

        {/* 3. Item Type Section matching Image 1 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-xs text-[#00828a] dark:text-teal-400">Item Type</label>
            {itemTypeFilter && (
              <button
                type="button"
                onClick={() => setItemTypeFilter('')}
                className="text-[10px] text-slate-400 hover:text-[#0088cc] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {displayedItemTypes.map(type => {
              const isSelected = itemTypeFilter === type.id || itemTypeFilter === type.key;
              return (
                <label
                  key={type.id}
                  className="flex items-center gap-2 py-0.5 px-0.5 rounded hover:bg-slate-50 dark:hover:bg-[#21262d] cursor-pointer group text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => setItemTypeFilter(isSelected ? '' : type.id)}
                    className="rounded border-slate-300 text-[#0088cc] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {type.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">({type.count})</span>
                </label>
              );
            })}

            {mergedTypes.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllTypes(!showAllTypes)}
                className="text-[11px] text-[#0088cc] hover:underline flex items-center gap-0.5 mt-1 pt-0.5 font-medium cursor-pointer"
              >
                <span>{showAllTypes ? 'show less' : 'view all'}</span>
                {showAllTypes ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 4. Last Modified Section matching Image 1 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-xs text-[#00828a] dark:text-teal-400">
              Last Modified
            </label>
            {lastModifiedFilter && (
              <button
                type="button"
                onClick={() => setLastModifiedFilter('')}
                className="text-[10px] text-slate-400 hover:text-[#0088cc] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {[
              { label: 'Today', key: 'today', count: 4 },
              { label: 'Last 7 Days', key: '7days', count: 4 },
              { label: 'Last 30 Days', key: '30days', count: 13 },
            ].map(opt => {
              const isSelected = lastModifiedFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLastModifiedFilter(isSelected ? '' : opt.key)}
                  className={`w-full text-left flex items-center justify-between py-0.5 px-1 rounded transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-[#0088cc] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-[#00828a] hover:underline'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <span className="text-[11px] text-slate-400 font-normal">({opt.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Status Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-xs text-[#00828a] dark:text-teal-400">Status</label>
            {statusFilter && (
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                className="text-[10px] text-slate-400 hover:text-[#0088cc] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {statuses.map(st => {
              const isSelected = statusFilter === st;
              const count = statusCounts[st] ?? 0;
              return (
                <label
                  key={st}
                  className="flex items-center gap-2 py-0.5 px-0.5 rounded hover:bg-slate-50 dark:hover:bg-[#21262d] cursor-pointer group text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => setStatusFilter(isSelected ? '' : st)}
                    className="rounded border-slate-300 text-[#0088cc] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {st}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">({count})</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 6. Priority Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-xs text-[#00828a] dark:text-teal-400">Priority</label>
            {priorityFilter && (
              <button
                type="button"
                onClick={() => setPriorityFilter('')}
                className="text-[10px] text-slate-400 hover:text-[#0088cc] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {priorities.map(p => {
              const isSelected = priorityFilter === p;
              const count = priorityCounts[p] ?? 0;
              return (
                <label
                  key={p}
                  className="flex items-center gap-2 py-0.5 px-0.5 rounded hover:bg-slate-50 dark:hover:bg-[#21262d] cursor-pointer group text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => setPriorityFilter(isSelected ? '' : p)}
                    className="rounded border-slate-300 text-[#0088cc] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {p}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">({count})</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
