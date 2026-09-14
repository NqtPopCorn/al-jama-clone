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
  CheckCircle2,
} from 'lucide-react';
import { ActiveFilter } from './types';

interface ReviewToolbarProps {
  itemCount: number;
  selectedCount: number;
  pendingUpdateCount?: number;
  highlightingEnabled: boolean;
  onToggleHighlighting: () => void;
  showRemovedItems: boolean;
  onToggleShowRemoved: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: ActiveFilter;
  onFilterChange: (filter: ActiveFilter) => void;
  onRefresh?: () => void;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  isModeratorMode?: boolean;
  onBatchApprove?: () => void;
  onBatchReject?: () => void;
  onBatchReviewed?: () => void;
  onBatchClear?: () => void;
  onSelectReadingView?: () => void;
  onToggleStats?: () => void;
  onToggleComments?: () => void;
  onSelectFeedbackView?: () => void;
  isReadingViewActive?: boolean;
  isStatsActive?: boolean;
  isCommentsActive?: boolean;
  isFeedbackActive?: boolean;
}

export const ReviewToolbar: React.FC<ReviewToolbarProps> = ({
  itemCount,
  selectedCount,
  pendingUpdateCount,
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
  isModeratorMode = false,
  onBatchApprove,
  onBatchReject,
  onBatchReviewed,
  onBatchClear,
  onSelectReadingView,
  onToggleStats,
  onToggleComments,
  onSelectFeedbackView,
  isReadingViewActive = true,
  isStatsActive = false,
  isCommentsActive = false,
  isFeedbackActive = false,
}) => {
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <div className="h-9 border-b border-slate-200 bg-slate-100/70 px-6 flex items-center justify-between flex-shrink-0 text-xs text-slate-600">
      {/* Left toolset: view icons, filter, search, refresh, count */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2.5">
          <button
            onClick={onSelectReadingView}
            className={`p-1 rounded transition-colors ${
              isReadingViewActive
                ? 'bg-slate-300 text-slate-900 shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
            title="Document / Reading view"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleStats}
            className={`p-1 rounded transition-colors ${
              isStatsActive
                ? 'bg-slate-300 text-slate-900 shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
            title="Statistics"
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSelectFeedbackView || onToggleComments}
            className={`p-1 rounded transition-colors ${
              isFeedbackActive || isCommentsActive
                ? 'bg-slate-300 text-slate-900 shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
            title="Feedback"
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
                ? 'text-blue-700 bg-blue-100 font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
            title="Filter items"
          >
            <Filter className="w-3.5 h-3.5" />
            {activeFilter !== 'ALL' && (
              <span className="text-[10px] bg-blue-600 text-white rounded px-1 font-bold">
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
                    activeFilter === fKey
                      ? 'font-bold text-blue-600 bg-blue-50/50'
                      : 'text-slate-700'
                  }`}
                >
                  {fLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-40">
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
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Refresh review items"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <span className="font-semibold text-slate-700 text-xs">{itemCount} items</span>

        {pendingUpdateCount !== undefined && pendingUpdateCount > 0 && (
          <button
            onClick={() => onFilterChange('UPDATED_SINCE_V1')}
            className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
              activeFilter === 'UPDATED_SINCE_V1'
                ? 'bg-cyan-600 text-white border-cyan-700 shadow-2xs'
                : 'bg-[#cffafe] text-[#0e7490] border-[#a5f3fc] hover:bg-[#bbf7d0]'
            }`}
            title="Click to filter items with pending updates"
          >
            {pendingUpdateCount} pending update{pendingUpdateCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Right toolset: Highlighting, Show removed, Batch item actions */}
      <div className="flex items-center gap-4">
        {/* Highlighting toggle pill */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Highlighting:</span>
          <button
            onClick={onToggleHighlighting}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all ${
              highlightingEnabled
                ? 'bg-[#48bb78] text-white shadow-2xs'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {highlightingEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Show removed items toggle pill */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Show removed items:</span>
          <button
            onClick={onToggleShowRemoved}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all ${
              showRemovedItems
                ? 'bg-[#48bb78] text-white shadow-2xs'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {showRemovedItems ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Batch item actions dropdown matching user Image 2 & 3 */}
        <div className="relative">
          <button
            onClick={() => setShowBatchMenu(!showBatchMenu)}
            className="px-2.5 py-1 rounded border border-slate-300 text-xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Batch item actions</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBatchMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1 text-xs"
              onMouseLeave={() => setShowBatchMenu(false)}
            >
              <button
                onClick={() => {
                  setShowBatchMenu(false);
                  onBatchApprove?.();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-[#15803d] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#16a34a] stroke-[2.5]" />
                <span>Approve selected (all)</span>
              </button>
              <button
                onClick={() => {
                  setShowBatchMenu(false);
                  onBatchReject?.();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-[#b91c1c] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4 text-[#dc2626] stroke-[2.5]" />
                <span>Reject selected (all)</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setShowBatchMenu(false);
                  onBatchClear?.();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-[#334155] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <MinusCircle className="w-4 h-4 text-[#64748b]" />
                <span>Clear status</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
