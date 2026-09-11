import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Check,
  X as CloseIcon,
  MessageSquare,
  Search,
  SlidersHorizontal,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Eye,
  AlertTriangle,
  HelpCircle,
  Edit2,
  GitCompare,
} from 'lucide-react';
import {
  useReviewDetail,
  useUpdateReviewItemStatusMutation,
  useBatchUpdateReviewStatusMutation,
  useCompleteReviewMutation,
} from '../hooks/useReviewApi';
import { ReviewCommentModal } from './ReviewCommentModal';
import { RejectReasonModal } from './RejectReasonModal';
import { ReviewItemReadingView, ReviewItemStatusValue } from '@aljama/shared';

interface ReviewExecutionViewProps {
  reviewId: string;
  onBack: () => void;
}

type ActiveFilter =
  | 'ALL'
  | 'APPROVED'
  | 'NEED_WORK'
  | 'WITH_MY_COMMENTS'
  | 'WITH_COMMENTS'
  | 'UPDATED_SINCE_V1'
  | 'UNMARKED';

export const ReviewExecutionView: React.FC<ReviewExecutionViewProps> = ({ reviewId, onBack }) => {
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'toc'>('summary');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeCommentItem, setActiveCommentItem] = useState<ReviewItemReadingView | null>(null);
  const [activeRejectItem, setActiveRejectItem] = useState<ReviewItemReadingView | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [finishSuccess, setFinishSuccess] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Data fetching
  const { data: review, isLoading, error } = useReviewDetail(reviewId);
  const updateStatusMutation = useUpdateReviewItemStatusMutation();
  const batchStatusMutation = useBatchUpdateReviewStatusMutation();
  const completeReviewMutation = useCompleteReviewMutation();

  // Item refs for smooth scroll from TOC
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filter items based on activeFilter and searchQuery
  const filteredItems = useMemo(() => {
    if (!review?.items) return [];

    let list = review.items;

    // Filter by quick sidebar filters
    if (activeFilter === 'APPROVED') {
      list = list.filter(i => i.status === 'APPROVED');
    } else if (activeFilter === 'NEED_WORK') {
      list = list.filter(i => i.status === 'REJECTED');
    } else if (activeFilter === 'WITH_COMMENTS') {
      list = list.filter(i => i.commentCount > 0);
    } else if (activeFilter === 'UNMARKED') {
      list = list.filter(i => i.status === 'NOT_REVIEWED');
    } else if (activeFilter === 'UPDATED_SINCE_V1') {
      list = list.filter(i => i.hasUpdatedSinceLastRevision);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.itemKey.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.customFields && JSON.stringify(i.customFields).toLowerCase().includes(q)),
      );
    }

    return list;
  }, [review?.items, activeFilter, searchQuery]);

  // Handle text selection inside document reading area
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleScrollToItem = (itemId: string) => {
    const el = itemRefs.current[itemId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Status updates
  const handleToggleReviewed = async (item: ReviewItemReadingView) => {
    const nextStatus =
      item.status === ReviewItemStatusValue.REVIEWED
        ? ReviewItemStatusValue.NOT_REVIEWED
        : ReviewItemStatusValue.REVIEWED;
    await updateStatusMutation.mutateAsync({
      reviewId,
      itemId: item.id,
      dto: { status: nextStatus },
    });
  };

  const handleApprove = async (item: ReviewItemReadingView) => {
    const nextStatus =
      item.status === ReviewItemStatusValue.APPROVED
        ? ReviewItemStatusValue.NOT_REVIEWED
        : ReviewItemStatusValue.APPROVED;
    await updateStatusMutation.mutateAsync({
      reviewId,
      itemId: item.id,
      dto: { status: nextStatus },
    });
  };

  const handleConfirmReject = async (reason: string) => {
    if (!activeRejectItem) return;
    await updateStatusMutation.mutateAsync({
      reviewId,
      itemId: activeRejectItem.id,
      dto: {
        status: ReviewItemStatusValue.REJECTED,
        rejectionComment: reason,
      },
    });
    setActiveRejectItem(null);
  };

  const handleBatchMarkPageAsReviewed = async () => {
    if (!review?.items || review.items.length === 0) return;
    const targetStatus: ReviewItemStatusValue =
      review.myRole === 'APPROVER'
        ? ReviewItemStatusValue.APPROVED
        : ReviewItemStatusValue.REVIEWED;

    await batchStatusMutation.mutateAsync({
      reviewId,
      dto: {
        reviewItemIds: filteredItems.map(i => i.id),
        status: targetStatus,
      },
    });
  };

  const handleFinishReview = async () => {
    setFinishError(null);
    try {
      await completeReviewMutation.mutateAsync(reviewId);
      setFinishSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setFinishError(e.response?.data?.message || e.message || 'Cannot complete review');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[500px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading review workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex-1 p-8 text-center bg-white min-h-[500px]">
        <div className="max-w-md mx-auto space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Failed to load review</h3>
          <p className="text-xs text-slate-500">
            {error instanceof Error ? error.message : 'Review not found or permission denied.'}
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#203a6b] text-white text-xs font-semibold rounded"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  const isReviewer = review.myRole === 'REVIEWER';
  const isApprover = review.myRole === 'APPROVER' || review.myRole === 'MODERATOR';

  // Progress percentage
  const totalItems = review.stats.totalItems || 1;
  const completedCount = isApprover
    ? review.stats.approvedCount + review.stats.rejectedCount
    : review.stats.reviewedCount;
  const progressPercent = Math.min(100, Math.round((completedCount / totalItems) * 100));

  // Helper to render text with search highlight
  const renderHighlightedText = (text?: string | null) => {
    if (!text) return null;
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 text-slate-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div
      className="flex flex-col flex-1 h-full bg-[#f4f5f7] overflow-hidden"
      onMouseUp={handleTextSelection}
    >
      {/* 1. Header Bar matching Jama Connect */}
      <header className="h-12 bg-[#203a6b] text-white flex items-center justify-between px-4 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-blue-200 hover:text-white flex items-center gap-1 text-xs font-medium pr-2 border-r border-blue-400/30"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Reviews</span>
          </button>

          {/* Breadcrumb Title */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-white/20 text-white text-[11px] font-bold flex items-center justify-center">
              {review.currentRevisionNumber}
            </span>
            <span className="font-bold text-xs tracking-wide">
              {review.name} - V{review.currentRevisionNumber}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
          </div>
        </div>

        {/* Right sub-navigation tabs */}
        <div className="flex items-center gap-1 text-xs">
          <button className="px-3 py-1 bg-white/20 font-semibold rounded text-white flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Review
          </button>
          <button className="px-3 py-1 hover:bg-white/10 rounded text-blue-100 transition-colors">
            Feedback
          </button>
          <button className="px-3 py-1 hover:bg-white/10 rounded text-blue-100 transition-colors">
            Stats
          </button>
          <button className="px-3 py-1 hover:bg-white/10 rounded text-blue-100 flex items-center gap-1 transition-colors">
            Tools
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Workspace Area (Sidebar + Center Content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 2. Left Sidebar (Collapsible) */}
        <aside
          className={`bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-200 ${
            isSidebarOpen ? 'w-64' : 'w-10'
          }`}
        >
          {/* Sidebar Top: Timer, Progress & Collapse toggle */}
          <div className="h-10 border-b border-slate-200 px-3 flex items-center justify-between bg-slate-50 text-xs">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-[11px]">0:00</span>
                  <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden ml-1">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="font-semibold text-[11px] text-slate-600">
                    {progressPercent}%
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  title="Collapse sidebar"
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="Expand sidebar"
                className="w-full flex justify-center text-slate-400 hover:text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSidebarOpen && (
            <>
              {/* Tab selector (Summary vs TOC/Search) */}
              <div className="flex border-b border-slate-200 text-xs bg-slate-100">
                <button
                  onClick={() => setSidebarTab('summary')}
                  className={`flex-1 py-2 font-semibold text-center border-b-2 transition-colors ${
                    sidebarTab === 'summary'
                      ? 'border-blue-600 bg-white text-blue-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setSidebarTab('toc')}
                  className={`flex-1 py-2 font-semibold text-center border-b-2 transition-colors ${
                    sidebarTab === 'toc'
                      ? 'border-blue-600 bg-white text-blue-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  TOC/Search
                </button>
              </div>

              {/* Tab 1: Summary filters matching Screen 2 */}
              {sidebarTab === 'summary' && (
                <div className="flex-1 flex flex-col justify-between p-3 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Filters:
                    </div>
                    <ul className="space-y-1.5 text-xs">
                      <li>
                        <button
                          onClick={() =>
                            setActiveFilter(activeFilter === 'APPROVED' ? 'ALL' : 'APPROVED')
                          }
                          className={`w-full text-left py-1 px-2 rounded flex items-center justify-between transition-colors ${
                            activeFilter === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{review.stats.approvedCount} items I've approved</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            setActiveFilter(activeFilter === 'NEED_WORK' ? 'ALL' : 'NEED_WORK')
                          }
                          className={`w-full text-left py-1 px-2 rounded flex items-center justify-between transition-colors ${
                            activeFilter === 'NEED_WORK'
                              ? 'bg-red-50 text-red-700 font-semibold'
                              : 'text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{review.stats.rejectedCount} items need more work</span>
                        </button>
                      </li>
                      <li>
                        <button className="w-full text-left py-1 px-2 text-slate-400 cursor-not-allowed text-[11px]">
                          <span>0 items I'm following</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            setActiveFilter(
                              activeFilter === 'WITH_MY_COMMENTS' ? 'ALL' : 'WITH_MY_COMMENTS',
                            )
                          }
                          className={`w-full text-left py-1 px-2 rounded flex items-center justify-between transition-colors ${
                            activeFilter === 'WITH_MY_COMMENTS'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{review.stats.myCommentsCount} items with my comments</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            setActiveFilter(
                              activeFilter === 'WITH_COMMENTS' ? 'ALL' : 'WITH_COMMENTS',
                            )
                          }
                          className={`w-full text-left py-1 px-2 rounded flex items-center justify-between transition-colors ${
                            activeFilter === 'WITH_COMMENTS'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{review.stats.totalComments} items with comments</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            setActiveFilter(
                              activeFilter === 'UPDATED_SINCE_V1' ? 'ALL' : 'UPDATED_SINCE_V1',
                            )
                          }
                          className={`w-full text-left py-1 px-2 rounded flex items-center justify-between transition-colors ${
                            activeFilter === 'UPDATED_SINCE_V1'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>
                            {review.stats.updatedSinceLastRevisionCount} items updated since V1
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            setActiveFilter(activeFilter === 'UNMARKED' ? 'ALL' : 'UNMARKED')
                          }
                          className={`w-full text-left py-1 px-2 rounded flex items-center justify-between transition-colors ${
                            activeFilter === 'UNMARKED'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{review.stats.unmarkedCount} items I haven't marked</span>
                        </button>
                      </li>
                    </ul>

                    {activeFilter !== 'ALL' && (
                      <button
                        onClick={() => setActiveFilter('ALL')}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline pl-2"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Sidebar Bottom: I'm Finished & Status */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    {finishError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">
                        {finishError}
                      </div>
                    )}
                    {finishSuccess && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-700">
                        Review completed successfully!
                      </div>
                    )}

                    <button
                      onClick={handleFinishReview}
                      disabled={completeReviewMutation.isPending || review.myIsFinished}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded border border-slate-300 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {review.myIsFinished ? "You're Finished" : "I'm Finished"}
                    </button>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-medium">My Status:</span>
                      <span
                        className={`font-semibold ${
                          review.myIsFinished ? 'text-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        {review.myIsFinished ? 'Finished' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: TOC & In-text search matching Screen 3 */}
              {sidebarTab === 'toc' && (
                <div className="flex-1 flex flex-col p-3 overflow-hidden">
                  {/* Search input */}
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full text-xs pl-8 pr-6 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* TOC Tree */}
                  <div className="flex-1 overflow-y-auto space-y-1">
                    <div className="text-[11px] font-bold text-slate-600 mb-1">
                      Table of Contents:
                    </div>
                    {review.items.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => handleScrollToItem(item.id)}
                        className="w-full text-left py-1 px-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded truncate flex items-center gap-1.5"
                      >
                        <span className="font-mono text-[10px] text-slate-400">{idx + 1}.</span>
                        <span className="truncate">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        {/* 3. Center Main Content Area (Reading View) */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Main Content Toolbar matching Screens 2 & 3 */}
          <div className="h-10 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50 text-xs flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">{filteredItems.length} Items</span>
              <div className="h-4 w-px bg-slate-300" />
              {/* Batch Action */}
              <button
                onClick={handleBatchMarkPageAsReviewed}
                disabled={batchStatusMutation.isPending}
                className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/60"
              >
                <span>Actions</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Icons toolbar */}
            <div className="flex items-center gap-3 text-slate-500">
              <button title="Edit item" className="hover:text-slate-800">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button title="Compare with previous revision" className="hover:text-slate-800">
                <GitCompare className="w-3.5 h-3.5" />
              </button>
              <button title="Filter view" className="hover:text-slate-800">
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button title="Help & documentation" className="hover:text-slate-800">
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Floating Action when text is selected */}
          {selectedText && (
            <div className="fixed bottom-14 right-10 z-40 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in">
              <span className="text-xs truncate max-w-xs font-mono">
                "{selectedText.slice(0, 30)}..."
              </span>
              <button
                onClick={() => {
                  if (filteredItems.length > 0) {
                    setActiveCommentItem(filteredItems[0]);
                  }
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
              >
                Comment on text
              </button>
              <button
                onClick={() => setSelectedText(null)}
                className="text-slate-400 hover:text-white"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reading Document Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-5xl mx-auto w-full">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400 italic">
                No items match the current filter or search criteria.
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isItemApproved = item.status === 'APPROVED';
                const isItemRejected = item.status === 'REJECTED';
                const isItemReviewed = item.status === 'REVIEWED';

                return (
                  <div
                    key={item.id}
                    ref={el => (itemRefs.current[item.id] = el)}
                    className="flex gap-4 group pb-6 border-b border-slate-100 last:border-b-0"
                  >
                    {/* Left Gutter: Comment badge + Status actions */}
                    <div className="w-20 flex-shrink-0 flex items-start justify-end gap-2 pt-1">
                      {/* Comment Bubble Icon with Badge */}
                      <button
                        onClick={() => {
                          setActiveCommentItem(item);
                        }}
                        className={`relative p-1 rounded hover:bg-slate-100 transition-colors ${
                          item.commentCount > 0
                            ? 'text-blue-600'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={`${item.commentCount} comments`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {item.commentCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#0099cc] text-white font-bold text-[10px] px-1 rounded-full min-w-4 text-center">
                            {item.commentCount}
                          </span>
                        )}
                      </button>

                      {/* Reviewer Action: Checkbox */}
                      {isReviewer && (
                        <button
                          onClick={() => handleToggleReviewed(item)}
                          title={isItemReviewed ? 'Marked as reviewed' : 'Mark as reviewed'}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isItemReviewed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {isItemReviewed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      )}

                      {/* Approver Actions: Approve (Check) & Reject (Cross) */}
                      {isApprover && (
                        <div className="flex items-center gap-1">
                          {/* Approve button */}
                          <button
                            onClick={() => handleApprove(item)}
                            title="Approve item"
                            className={`p-1 rounded transition-colors ${
                              isItemApproved
                                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600'
                                : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>

                          {/* Reject button */}
                          <button
                            onClick={() => setActiveRejectItem(item)}
                            title="Reject item (requires comment)"
                            className={`p-1 rounded transition-colors ${
                              isItemRejected
                                ? 'bg-red-100 text-red-700 ring-1 ring-red-600'
                                : 'text-slate-300 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <CloseIcon className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Item Body: Title, Fields, Tables */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.itemKey}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {renderHighlightedText(item.name)}
                        </h3>
                        {item.hasUpdatedSinceLastRevision && (
                          <span
                            title="Updated since previous revision"
                            className="text-amber-500 hover:text-amber-600 flex items-center"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Structured custom fields or description rendering */}
                      {item.customFields && Object.keys(item.customFields).length > 0 ? (
                        <div className="border border-slate-200 rounded overflow-hidden mt-2">
                          <table className="w-full text-xs divide-y divide-slate-200">
                            <tbody className="divide-y divide-slate-100">
                              {Object.entries(item.customFields).map(([key, val]) => (
                                <tr key={key}>
                                  <td className="w-36 px-3 py-2 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                  </td>
                                  <td className="px-3 py-2 text-slate-800 whitespace-pre-wrap leading-relaxed">
                                    {renderHighlightedText(String(val))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : item.description ? (
                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap p-3 bg-slate-50/60 rounded border border-slate-100">
                          {renderHighlightedText(item.description)}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          No description provided.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Pagination Bar matching Screens 2 & 3 */}
          <footer className="h-9 border-t border-slate-200 px-6 flex items-center justify-between bg-slate-50 text-xs text-slate-500 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span>Page 1 of 1</span>
              <span>•</span>
              <span>Show: 50</span>
            </div>
            <div>
              Displaying 1 - {filteredItems.length} of {filteredItems.length}
            </div>
          </footer>
        </main>
      </div>

      {/* Comment Modal */}
      {activeCommentItem && (
        <ReviewCommentModal
          isOpen={!!activeCommentItem}
          onClose={() => {
            setActiveCommentItem(null);
            setSelectedText(null);
          }}
          reviewId={reviewId}
          itemId={activeCommentItem.id}
          itemKey={activeCommentItem.itemKey}
          itemName={activeCommentItem.name}
          selectedText={selectedText}
          onClearSelectedText={() => setSelectedText(null)}
        />
      )}

      {/* Mandatory Reject Reason Modal */}
      {activeRejectItem && (
        <RejectReasonModal
          isOpen={!!activeRejectItem}
          onClose={() => setActiveRejectItem(null)}
          onConfirm={handleConfirmReject}
          itemKey={activeRejectItem.itemKey}
          itemName={activeRejectItem.name}
          isSubmitting={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
};
