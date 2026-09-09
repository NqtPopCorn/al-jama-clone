import React from 'react';
import { useProjectStore, ViewMode } from '../../../stores/project.store';
import { Search, Table, BookOpen, LayoutDashboard, X, Filter } from 'lucide-react';

interface FilterToolbarProps {
  itemTypeFilter: string;
  statusFilter: string;
  priorityFilter: string;
  onItemTypeChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onResetFilters: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  itemTypeFilter,
  statusFilter,
  priorityFilter,
  onItemTypeChange,
  onStatusChange,
  onPriorityChange,
  onResetFilters,
}) => {
  const { activeView, setActiveView, searchQuery, setSearchQuery } = useProjectStore();

  const hasActiveFilters =
    !!searchQuery || !!itemTypeFilter || !!statusFilter || !!priorityFilter;

  return (
    <div className="p-3 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left Search and Filters */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Keyword Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, ID, text..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Item Type Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1">
          <Filter className="w-3 h-3 text-slate-500" />
          <select
            value={itemTypeFilter}
            onChange={(e) => onItemTypeChange(e.target.value)}
            className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-200">
              All Types
            </option>
            <option value="REQ" className="bg-slate-900 text-slate-200">
              Requirement (REQ)
            </option>
            <option value="UC" className="bg-slate-900 text-slate-200">
              Use Case (UC)
            </option>
            <option value="TC" className="bg-slate-900 text-slate-200">
              Test Case (TC)
            </option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none cursor-pointer"
        >
          <option value="" className="bg-slate-900 text-slate-200">
            All Statuses
          </option>
          <option value="Draft" className="bg-slate-900 text-slate-200">
            Draft
          </option>
          <option value="In Review" className="bg-slate-900 text-slate-200">
            In Review
          </option>
          <option value="Approved" className="bg-slate-900 text-slate-200">
            Approved
          </option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none cursor-pointer"
        >
          <option value="" className="bg-slate-900 text-slate-200">
            All Priorities
          </option>
          <option value="High" className="bg-slate-900 text-slate-200">
            High
          </option>
          <option value="Medium" className="bg-slate-900 text-slate-200">
            Medium
          </option>
          <option value="Low" className="bg-slate-900 text-slate-200">
            Low
          </option>
        </select>

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-2 py-1 text-[11px] rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Right View Switcher */}
      <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveView('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
            activeView === 'list'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Spreadsheet List View (BR-NAV-05)"
        >
          <Table className="w-3.5 h-3.5" />
          <span>List View</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('reading')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
            activeView === 'reading'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Document Reading View (BR-NAV-06)"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reading View</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
            activeView === 'dashboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Project High-Level Dashboard (BR-NAV-03)"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>
    </div>
  );
};
