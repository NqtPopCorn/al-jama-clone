import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { ReviewDetail, ReviewItemReadingView } from '@aljama/shared';
import { ActiveFilter } from './types';

interface ReviewSidebarProps {
  review: ReviewDetail;
  isOpen: boolean;
  onToggleOpen: () => void;
  tab: 'summary' | 'toc';
  onTabChange: (tab: 'summary' | 'toc') => void;
  activeFilter: ActiveFilter;
  onFilterChange: (filter: ActiveFilter) => void;
  onScrollToItem: (itemId: string) => void;
  filteredItems: ReviewItemReadingView[];
}

export const ReviewSidebar: React.FC<ReviewSidebarProps> = ({
  review,
  isOpen,
  onToggleOpen,
  tab,
  onTabChange,
  activeFilter,
  onFilterChange,
  onScrollToItem,
  filteredItems,
}) => {
  const totalParticipants = review.participants?.length || 0;
  const finishedParticipants = review.participants?.filter(p => p.isFinished)?.length || 0;
  const progressPercent =
    totalParticipants > 0 ? Math.round((finishedParticipants / totalParticipants) * 100) : 0;

  // Counts
  const approvedCount =
    review.items?.filter(i => i.status === 'APPROVED' || i.status === 'REVIEWED')?.length || 0;
  const needsWorkCount =
    review.items?.filter(
      i =>
        i.status === 'REJECTED' ||
        (i.overallStatusSummary && i.overallStatusSummary.rejectedCount > 0),
    )?.length || 0;
  const withCommentsCount = review.items?.filter(i => i.commentCount > 0)?.length || 0;

  return (
    <aside
      className={`border-r border-slate-200 bg-slate-50/50 flex-shrink-0 flex flex-col transition-all duration-200 ${
        isOpen ? 'w-64' : 'w-10 items-center'
      }`}
    >
      {/* Sidebar Header & Toggle */}
      <div className="h-9 border-b border-slate-200 px-3 flex items-center justify-between flex-shrink-0">
        {isOpen ? (
          <>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>⏱ 0:00</span>
              <span className="font-semibold text-slate-700 ml-2">{progressPercent}%</span>
            </div>
            <button
              onClick={onToggleOpen}
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleOpen}
            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 w-full flex justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          {/* Tab buttons: Summary vs TOC */}
          <div className="grid grid-cols-2 border-b border-slate-200 text-xs">
            <button
              onClick={() => onTabChange('summary')}
              className={`py-2 text-center font-semibold transition-colors ${
                tab === 'summary'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => onTabChange('toc')}
              className={`py-2 text-center font-semibold transition-colors ${
                tab === 'toc'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              TOC/Search
            </button>
          </div>

          {/* Tab 1: Summary */}
          {tab === 'summary' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-600">
              {/* Review Progress */}
              <div className="space-y-2">
                <div className="font-bold text-[11px] text-slate-800 uppercase tracking-wider">
                  Review Progress:
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Participants:</span>
                  <span className="font-semibold text-slate-700">
                    {finishedParticipants} / {totalParticipants} Finished
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Approved by all:</span>
                    <span className="font-semibold text-slate-800">{approvedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Needs work:</span>
                    <span className="font-semibold text-red-600">{needsWorkCount}</span>
                  </div>
                </div>
              </div>

              {/* Participants list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold text-[11px] text-slate-800 uppercase tracking-wider">
                  <span>Participants:</span>
                  <span className="text-slate-400 font-normal">({totalParticipants})</span>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {review.participants?.map(p => (
                    <div
                      key={p.id}
                      className="p-1.5 rounded bg-white border border-slate-200/70 text-[11px] flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-semibold text-slate-800 truncate">
                          {p.fullName || p.username}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">{p.reviewRole}</div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                          p.isFinished
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.isFinished ? 'Finished' : 'In Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="font-bold text-[11px] text-slate-800 uppercase tracking-wider mb-1">
                  Quick Filters:
                </div>
                <button
                  onClick={() => onFilterChange('ALL')}
                  className={`w-full text-left py-1 px-2 rounded flex justify-between items-center transition-colors ${
                    activeFilter === 'ALL'
                      ? 'bg-blue-100 text-blue-800 font-bold'
                      : 'hover:bg-slate-200/60 text-blue-600'
                  }`}
                >
                  <span>All Items</span>
                  <span className="font-mono text-[10px]">{review.items?.length || 0}</span>
                </button>
                <button
                  onClick={() => onFilterChange('NEED_WORK')}
                  className={`w-full text-left py-1 px-2 rounded flex justify-between items-center transition-colors ${
                    activeFilter === 'NEED_WORK'
                      ? 'bg-red-100 text-red-800 font-bold'
                      : 'hover:bg-slate-200/60 text-red-600'
                  }`}
                >
                  <span>Items with rejections</span>
                  <span className="font-mono text-[10px]">{needsWorkCount}</span>
                </button>
                <button
                  onClick={() => onFilterChange('WITH_COMMENTS')}
                  className={`w-full text-left py-1 px-2 rounded flex justify-between items-center transition-colors ${
                    activeFilter === 'WITH_COMMENTS'
                      ? 'bg-blue-100 text-blue-800 font-bold'
                      : 'hover:bg-slate-200/60 text-blue-600'
                  }`}
                >
                  <span>Items with comments</span>
                  <span className="font-mono text-[10px]">{withCommentsCount}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: TOC / Search */}
          {tab === 'toc' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-700">Filter By:</div>
                <select
                  value={activeFilter}
                  onChange={e => onFilterChange(e.target.value as ActiveFilter)}
                  className="w-full text-xs p-1 bg-white border border-slate-300 rounded"
                >
                  <option value="ALL">All Items</option>
                  <option value="APPROVED">Approved Items</option>
                  <option value="NEED_WORK">Needs Work / Rejected</option>
                  <option value="WITH_MY_COMMENTS">With My Comments</option>
                  <option value="WITH_COMMENTS">With Comments</option>
                  <option value="UPDATED_SINCE_V1">Updated Since V1</option>
                  <option value="UNMARKED">Unmarked Items</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-600 mb-1">Table of Contents:</div>
                {review.items?.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => onScrollToItem(item.id)}
                    className="w-full text-left py-1 px-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded truncate flex items-center gap-1.5 transition-colors"
                  >
                    <span className="font-mono text-[10px] text-slate-400">{idx + 1}.</span>
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom user status */}
          <div className="h-8 border-t border-slate-200 px-3 flex items-center justify-between text-[11px] bg-slate-100/80 text-slate-600 flex-shrink-0">
            <span>My Status:</span>
            <span
              className={`font-semibold ${
                review.myIsFinished ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {review.myIsFinished ? 'Finished' : 'In Progress'}
            </span>
          </div>
        </>
      )}
    </aside>
  );
};
