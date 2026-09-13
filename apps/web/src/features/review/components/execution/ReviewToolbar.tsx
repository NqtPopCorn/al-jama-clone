import React, { useState } from 'react';
import {
  FileText,
  BarChart2,
  MessageSquare,
  Filter,
  Search,
  RotateCw,
  ChevronDown,
  Check,
  X as CloseIcon,
  MinusCircle,
} from 'lucide-react';
import { ActiveFilter } from './types';

interface ReviewToolbarProps {
  itemCount: number;
  selectedCount: number;
  highlightingEnabled: boolean;
  onToggleHighlighting: () => void;
  showRemovedItems: boolean;
  onToggleShowRemoved: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: ActiveFilter;
  onFilterChange: (filter: ActiveFilter) => void;
  onRefresh: () => void;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  onBatchApprove?: () => void;
  onBatchReject?: () => void;
  onBatchReviewed?: () => void;
  onBatchClear?: () => void;
}

export const ReviewToolbar: React.FC<ReviewToolbarProps> = ({
  itemCount,
  selectedCount,
  highlightingEnabled,
  onToggleHighlighting,
  showRemovedItems,
  onToggleShowRemoved,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onRefresh,
  isApproverMode,
  isReviewerMode,
  onBatchApprove,
  onBatchReject,
  onBatchReviewed,
  onBatchClear,
}) => {
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <div className="h-10 border-b border-slate-200 bg-slate-50/80 px-6 flex items-center justify-between flex-shrink-0 text-xs text-slate-600">
      {/* Left toolset: icons & search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
          <button
            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 rounded"
            title="Reading view"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded"
            title="Statistics"
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded"
            title="Stream / Comments"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter popover trigger */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`p-1 rounded flex items-center gap-1 transition-colors ${
              activeFilter !== 'ALL'
                ? 'text-blue-600 bg-blue-50 font-semibold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'
            }`}
            title="Filter items"
          >
            <Filter className="w-3.5 h-3.5" />
            {activeFilter !== 'ALL' && (
              <span className="text-[10px] bg-blue-600 text-white rounded px-1">
                {activeFilter}
              </span>
            )}
          </button>

          {showFilterDropdown && (
            <div
              className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded shadow-lg z-50 py-1 text-xs"
              onMouseLeave={() => setShowFilterDropdown(false)}
            >
              {(
                [
                  ['ALL', 'All items'],
                  ['APPROVED', 'Approved items'],
                  ['NEED_WORK', 'Needs work / Rejected'],
                  ['WITH_COMMENTS', 'Items with comments'],
                  ['UNMARKED', 'Unmarked items'],
                ] as const
              ).map(([fKey, fLabel]) => (
                <button
                  key={fKey}
                  onClick={() => {
                    onFilterChange(fKey);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${
                    activeFilter === fKey ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  {fLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-44">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-6 pr-2 py-0.5 text-xs bg-white border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Refresh & Item count */}
        <button
          onClick={onRefresh}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded"
          title="Refresh review items"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <span className="font-semibold text-slate-700 text-xs">{itemCount} items</span>
      </div>

      {/* Right toolset: Highlighting, Show removed, Batch item actions */}
      <div className="flex items-center gap-4">
        {/* Highlighting toggle */}
        <div className="flex items-center gap-1.5">
          <span>Highlighting:</span>
          <button
            onClick={onToggleHighlighting}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
              highlightingEnabled
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {highlightingEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Show removed items toggle */}
        <div className="flex items-center gap-1.5">
          <span>Show removed items:</span>
          <button
            onClick={onToggleShowRemoved}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
              showRemovedItems
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {showRemovedItems ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Batch item actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBatchMenu(!showBatchMenu)}
            className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1 transition-colors ${
              selectedCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Batch item actions</span>
            {selectedCount > 0 && (
              <span className="bg-blue-600 text-white rounded-full px-1.5 text-[10px] font-bold">
                {selectedCount}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBatchMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded shadow-lg z-50 py-1 text-xs"
              onMouseLeave={() => setShowBatchMenu(false)}
            >
              {isApproverMode && (
                <>
                  <button
                    onClick={() => {
                      setShowBatchMenu(false);
                      onBatchApprove?.();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-emerald-700 flex items-center gap-1.5 font-medium"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve selected ({selectedCount || 'all'})</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowBatchMenu(false);
                      onBatchReject?.();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700 flex items-center gap-1.5 font-medium"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                    <span>Reject selected ({selectedCount || 'all'})</span>
                  </button>
                </>
              )}

              {isReviewerMode && (
                <button
                  onClick={() => {
                    setShowBatchMenu(false);
                    onBatchReviewed?.();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-emerald-700 flex items-center gap-1.5 font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark selected as reviewed</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowBatchMenu(false);
                  onBatchClear?.();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 border-t border-slate-100"
              >
                <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear status</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
