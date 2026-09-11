import React, { useState } from 'react';
import { Star, ChevronDown, Search } from 'lucide-react';

interface JamaStreamFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: 'all' | 'mentions' | 'questions' | 'starred';
  onFilterChange: (filter: 'all' | 'mentions' | 'questions' | 'starred') => void;
}

export const JamaStreamFilterBar: React.FC<JamaStreamFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}) => {
  const [showQuickFilters, setShowQuickFilters] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1.5 my-2.5 text-xs select-none">
      {/* Star / Favorites Button */}
      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === 'starred' ? 'all' : 'starred')}
        className={`h-7 px-2 border rounded-sm flex items-center gap-1 transition-colors ${
          activeFilter === 'starred'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600'
            : 'bg-white dark:bg-[#161b22] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
        }`}
        title="Filter Starred Comments"
      >
        <Star
          className={`w-3.5 h-3.5 ${activeFilter === 'starred' ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`}
        />
        <ChevronDown className="w-2.5 h-2.5 opacity-50" />
      </button>

      {/* Search Input: Filter Comments */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Filter Comments"
          className="h-7 w-40 sm:w-48 pl-2.5 pr-6 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-sm text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#00a2db] focus:ring-1 focus:ring-[#00a2db]/20"
        />
        <Search className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
      </div>

      {/* Quick Filters Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowQuickFilters(!showQuickFilters)}
          className="h-7 px-2.5 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-sm flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium"
        >
          <span>
            {activeFilter === 'all'
              ? 'Quick Filters'
              : activeFilter === 'mentions'
                ? 'Mentions Only'
                : activeFilter === 'questions'
                  ? 'Questions'
                  : 'Starred'}
          </span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {showQuickFilters && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1e2329] border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-40 text-xs">
            <button
              type="button"
              onClick={() => {
                onFilterChange('all');
                setShowQuickFilters(false);
              }}
              className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                activeFilter === 'all'
                  ? 'font-bold text-[#0088cc]'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              All Comments
            </button>
            <button
              type="button"
              onClick={() => {
                onFilterChange('mentions');
                setShowQuickFilters(false);
              }}
              className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                activeFilter === 'mentions'
                  ? 'font-bold text-[#0088cc]'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Mentions Only
            </button>
            <button
              type="button"
              onClick={() => {
                onFilterChange('questions');
                setShowQuickFilters(false);
              }}
              className={`w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                activeFilter === 'questions'
                  ? 'font-bold text-[#0088cc]'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Questions / Actions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
