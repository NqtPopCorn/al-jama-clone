import React, { useState, useMemo, useRef } from 'react';
import { X as CloseIcon } from 'lucide-react';
import {
  useReviewDetail,
  useUpdateReviewItemStatusMutation,
  useBatchUpdateReviewStatusMutation,
  useCompleteReviewMutation,
  useCloseForFeedbackMutation,
  useReopenReviewMutation,
  useFinalizeReviewMutation,
} from '../hooks/useReviewApi';
import { ReviewCommentModal } from './ReviewCommentModal';
import { RejectReasonModal } from './RejectReasonModal';
import { ReviewItemReadingView, ReviewItemStatusValue, ReviewRole } from '@aljama/shared';
import {
  ActiveFilter,
  ViewMode,
  ReviewTopBar,
  ReviewToolbar,
  ReviewSidebar,
  ReviewItemList,
  ReviewModeratorSingleView,
  ReviewParticipantsModal,
  ReviewPaginationBar,
  ReviewItemEditModal,
  ReviewFeedbackStreamView,
  ReviewPublishRevisionModal,
  ReviewDiffEditsModal,
} from './execution';

interface ReviewExecutionViewProps {
  reviewId: string;
  onBack: () => void;
}

export const ReviewExecutionView: React.FC<ReviewExecutionViewProps> = ({ reviewId, onBack }) => {
  // Sidebar states - default collapsed/closed matching reference screenshots
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'toc'>('summary');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // View mode: Reading View (all items) vs Single Item View (Moderator detailed review)
  const [viewMode, setViewMode] = useState<ViewMode>('READING_VIEW');
  const [singleItemIndex, setSingleItemIndex] = useState(0);
  const [hasInitializedViewMode, setHasInitializedViewMode] = useState(false);

  // Toolbar toggles & menus
  const [highlightingEnabled, setHighlightingEnabled] = useState(true);
  const [showRemovedItems, setShowRemovedItems] = useState(true);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showPublishRevisionModal, setShowPublishRevisionModal] = useState(false);

  // Selected items for batch actions
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Modals state
  const [activeCommentItem, setActiveCommentItem] = useState<ReviewItemReadingView | null>(null);
  const [activeRejectItem, setActiveRejectItem] = useState<ReviewItemReadingView | null>(null);
  const [editingItem, setEditingItem] = useState<ReviewItemReadingView | null>(null);
  const [diffModalItem, setDiffModalItem] = useState<ReviewItemReadingView | null>(null);
  const [pendingEditedMap, setPendingEditedMap] = useState<
    Record<
      string,
      {
        name?: string;
        description?: string | null;
        customFields?: Record<string, unknown> | null;
      }
    >
  >({});
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Data fetching
  const { data: review, isLoading, error, refetch } = useReviewDetail(reviewId);
  const updateStatusMutation = useUpdateReviewItemStatusMutation();
  const batchStatusMutation = useBatchUpdateReviewStatusMutation();
  const completeReviewMutation = useCompleteReviewMutation();
  const closeForFeedbackMutation = useCloseForFeedbackMutation();
  const reopenReviewMutation = useReopenReviewMutation();
  const finalizeReviewMutation = useFinalizeReviewMutation();

  // Determine active role strictly from user's review assignment or ?role= url param for testing
  const activeRole: ReviewRole = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role')?.toUpperCase();
    if (roleParam === 'MODERATOR') return ReviewRole.MODERATOR;
    if (roleParam === 'APPROVER') return ReviewRole.APPROVER;
    if (roleParam === 'REVIEWER') return ReviewRole.REVIEWER;

    if (review?.myRole) {
      return review.myRole as ReviewRole;
    }
    if (review?.isModerator) {
      return ReviewRole.MODERATOR;
    }
    return ReviewRole.REVIEWER;
  }, [review]);

  const isModeratorMode = activeRole === ReviewRole.MODERATOR;
  const isApproverMode = activeRole === ReviewRole.APPROVER;
  const isReviewerMode = activeRole === ReviewRole.REVIEWER;

  // Initialize view mode: Moderator view defaults to SINGLE_ITEM_VIEW matching Image 2
  React.useEffect(() => {
    if (review && !hasInitializedViewMode) {
      if (isModeratorMode) {
        setViewMode('SINGLE_ITEM_VIEW');
      } else {
        setViewMode('READING_VIEW');
      }
      setHasInitializedViewMode(true);
    }
  }, [review, isModeratorMode, hasInitializedViewMode]);

  // Refs for scrolling to item
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Merge pending edited state with items from backend
  const mergedItems = useMemo(() => {
    if (!review?.items) return [];
    return review.items.map(item => {
      const pendingEdit = pendingEditedMap[item.id] || pendingEditedMap[item.itemId];
      if (pendingEdit) {
        return {
          ...item,
          hasUpdatedSinceLastRevision: true,
          editedContent: {
            name: pendingEdit.name ?? item.name,
            description:
              pendingEdit.description !== undefined ? pendingEdit.description : item.description,
            customFields: pendingEdit.customFields ?? item.customFields,
          },
          // Giữ nguyên hiển thị baseline trong review cho đến khi publish revision mới
          name: item.baselineContent?.name || item.name,
          description:
            item.baselineContent?.description !== undefined
              ? item.baselineContent.description
              : item.description,
          customFields: item.baselineContent?.customFields || item.customFields,
        };
      }
      return item;
    });
  }, [review?.items, pendingEditedMap]);

  // Filter items based on active quick filter & search query
  const filteredItems = useMemo(() => {
    if (!mergedItems) return [];

    return mergedItems.filter(item => {
      // Search text query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesKey = item.itemKey.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesKey && !matchesDesc) {
          return false;
        }
      }

      // Quick filter
      switch (activeFilter) {
        case 'APPROVED':
          return item.status === 'APPROVED';
        case 'NEED_WORK':
          return (
            item.status === 'REJECTED' ||
            (item.overallStatusSummary && item.overallStatusSummary.rejectedCount > 0)
          );
        case 'WITH_COMMENTS':
          return item.commentCount > 0;
        case 'UPDATED_SINCE_V1':
          return !!item.hasUpdatedSinceLastRevision;
        case 'UNMARKED':
          return item.status === 'NOT_REVIEWED' || !item.status;
        case 'ALL':
        default:
          return true;
      }
    });
  }, [mergedItems, activeFilter, searchQuery]);

  // Item selection toggles
  const toggleSelectItem = (itemId: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setSelectedItemIds(next);
  };

  const handleScrollToItem = (itemId: string) => {
    const el = itemRefs.current[itemId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Status mutation handlers
  const handleApprove = async (item: ReviewItemReadingView) => {
    if (!review) return;
    try {
      const nextStatus =
        item.status === ReviewItemStatusValue.APPROVED
          ? ReviewItemStatusValue.NOT_REVIEWED
          : ReviewItemStatusValue.APPROVED;
      await updateStatusMutation.mutateAsync({
        reviewId: review.id,
        itemId: item.id,
        dto: { status: nextStatus },
      });
      setActionSuccessMsg(
        nextStatus === ReviewItemStatusValue.APPROVED
          ? 'Item đã được Approve thành công.'
          : 'Đã bỏ đánh dấu item.',
      );
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể cập nhật trạng thái Approve.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleToggleReviewed = async (item: ReviewItemReadingView) => {
    if (!review) return;
    try {
      const nextStatus =
        item.status === ReviewItemStatusValue.REVIEWED
          ? ReviewItemStatusValue.NOT_REVIEWED
          : ReviewItemStatusValue.REVIEWED;
      await updateStatusMutation.mutateAsync({
        reviewId: review.id,
        itemId: item.id,
        dto: { status: nextStatus },
      });
      setActionSuccessMsg(
        nextStatus === ReviewItemStatusValue.REVIEWED
          ? 'Đã đánh dấu đã xem (Reviewed).'
          : 'Đã bỏ đánh dấu item.',
      );
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể cập nhật trạng thái.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleClearStatus = async (item: ReviewItemReadingView) => {
    if (!review) return;
    try {
      await updateStatusMutation.mutateAsync({
        reviewId: review.id,
        itemId: item.id,
        dto: { status: ReviewItemStatusValue.NOT_REVIEWED },
      });
      setActionSuccessMsg('Đã bỏ đánh dấu (Clear status) thành công.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể bỏ đánh dấu item.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!review || !activeRejectItem) return;
    try {
      await updateStatusMutation.mutateAsync({
        reviewId: review.id,
        itemId: activeRejectItem.id,
        dto: {
          status: ReviewItemStatusValue.REJECTED,
          rejectionComment: reason,
        },
      });
      setActiveRejectItem(null);
      setActionSuccessMsg('Đã từ chối (Reject) item kèm lý do.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể từ chối item.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  // Batch actions
  const handleBatchApprove = async () => {
    if (!review) return;
    const targetIds =
      selectedItemIds.size > 0 ? Array.from(selectedItemIds) : filteredItems.map(i => i.id);
    if (targetIds.length === 0) return;

    try {
      await batchStatusMutation.mutateAsync({
        reviewId: review.id,
        dto: {
          reviewItemIds: targetIds,
          status: ReviewItemStatusValue.APPROVED,
        },
      });
      setSelectedItemIds(new Set());
      setActionSuccessMsg(`Đã Approve ${targetIds.length} items thành công.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể thực hiện batch approve.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleBatchReject = async () => {
    if (!review) return;
    const targetIds =
      selectedItemIds.size > 0 ? Array.from(selectedItemIds) : filteredItems.map(i => i.id);
    if (targetIds.length === 0) return;

    try {
      await batchStatusMutation.mutateAsync({
        reviewId: review.id,
        dto: {
          reviewItemIds: targetIds,
          status: ReviewItemStatusValue.REJECTED,
          rejectionComment: 'Batch rejected by approver',
        },
      });
      setSelectedItemIds(new Set());
      setActionSuccessMsg(`Đã Reject ${targetIds.length} items.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể thực hiện batch reject.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleBatchReviewed = async () => {
    if (!review) return;
    const targetIds =
      selectedItemIds.size > 0 ? Array.from(selectedItemIds) : filteredItems.map(i => i.id);
    if (targetIds.length === 0) return;

    try {
      await batchStatusMutation.mutateAsync({
        reviewId: review.id,
        dto: {
          reviewItemIds: targetIds,
          status: ReviewItemStatusValue.REVIEWED,
        },
      });
      setSelectedItemIds(new Set());
      setActionSuccessMsg(`Đã đánh dấu đã xem ${targetIds.length} items.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể thực hiện batch mark as reviewed.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleBatchClear = async () => {
    if (!review) return;
    const targetIds =
      selectedItemIds.size > 0 ? Array.from(selectedItemIds) : filteredItems.map(i => i.id);
    if (targetIds.length === 0) return;

    try {
      await batchStatusMutation.mutateAsync({
        reviewId: review.id,
        dto: {
          reviewItemIds: targetIds,
          status: ReviewItemStatusValue.NOT_REVIEWED,
        },
      });
      setSelectedItemIds(new Set());
      setActionSuccessMsg(`Đã bỏ đánh dấu ${targetIds.length} items.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể xóa trạng thái items.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  // Reviewer specific: Mark page as reviewed
  const handleMarkPageAsReviewed = async () => {
    if (!review) return;
    const targetIds = filteredItems.map(i => i.id);
    if (targetIds.length === 0) return;

    try {
      await batchStatusMutation.mutateAsync({
        reviewId: review.id,
        dto: {
          reviewItemIds: targetIds,
          status: ReviewItemStatusValue.REVIEWED,
        },
      });
      setActionSuccessMsg(`Đã đánh dấu tất cả ${targetIds.length} items trong trang là đã xem!`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể đánh dấu trang là đã xem.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  // Moderator actions
  const handleCloseForFeedback = async () => {
    if (!review) return;
    try {
      await closeForFeedbackMutation.mutateAsync(review.id);
      setActionSuccessMsg('Review đã được chuyển sang trạng thái CLOSED_FOR_FEEDBACK.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Không thể đóng review để nhận feedback.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleReopenReview = async () => {
    if (!review) return;
    try {
      await reopenReviewMutation.mutateAsync(review.id);
      setActionSuccessMsg('Review đã được mở lại thành công.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Không thể mở lại review.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleFinalizeReview = async () => {
    if (!review) return;
    try {
      await finalizeReviewMutation.mutateAsync(review.id);
      setActionSuccessMsg('Review đã được Finalize & Complete thành công.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      setActionErrorMsg(
        err?.response?.data?.message || 'Không thể finalize review (kiểm tra reject).',
      );
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  const handleCompleteReview = async () => {
    if (!review) return;
    try {
      await completeReviewMutation.mutateAsync(review.id);
      setActionSuccessMsg('Bạn đã hoàn tất phần review của mình!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch {
      setActionErrorMsg('Không thể hoàn tất review.');
      setTimeout(() => setActionErrorMsg(null), 3000);
    }
  };

  // Highlight matched search text
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim() || !highlightingEnabled) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 rounded-xs px-0.5">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
        Loading review session...
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex-1 p-8 text-center">
        <div className="text-red-600 font-semibold mb-2">Failed to load review.</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
        >
          Return to Reviews List
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {/* 1. Review Top Bar */}
      <ReviewTopBar
        review={review}
        onBack={onBack}
        activeRole={activeRole}
        isModeratorMode={isModeratorMode}
        isApproverMode={isApproverMode}
        isReviewerMode={isReviewerMode}
        onPublishRevision={() => setShowPublishRevisionModal(true)}
        onCloseForFeedback={handleCloseForFeedback}
        onReopenReview={handleReopenReview}
        onFinalizeReview={handleFinalizeReview}
        onOpenParticipantsModal={() => setShowAddParticipantModal(true)}
        onCompleteReview={handleCompleteReview}
        isActionPending={
          updateStatusMutation.isPending ||
          batchStatusMutation.isPending ||
          completeReviewMutation.isPending
        }
      />

      {/* 2. Review Toolbar */}
      <ReviewToolbar
        itemCount={filteredItems.length}
        selectedCount={selectedItemIds.size}
        pendingUpdateCount={mergedItems.filter(i => i.hasUpdatedSinceLastRevision).length}
        highlightingEnabled={highlightingEnabled}
        onToggleHighlighting={() => setHighlightingEnabled(!highlightingEnabled)}
        showRemovedItems={showRemovedItems}
        onToggleShowRemoved={() => setShowRemovedItems(!showRemovedItems)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onRefresh={() => refetch()}
        isApproverMode={isApproverMode}
        isReviewerMode={isReviewerMode}
        isModeratorMode={isModeratorMode}
        onBatchApprove={handleBatchApprove}
        onBatchReject={handleBatchReject}
        onBatchReviewed={handleBatchReviewed}
        onBatchClear={handleBatchClear}
        onSelectReadingView={() => {
          setViewMode('READING_VIEW');
          setIsSidebarOpen(false);
        }}
        onToggleStats={() => {
          setSidebarTab('summary');
          setIsSidebarOpen(prev => !prev);
          setViewMode('READING_VIEW');
        }}
        onSelectFeedbackView={() => {
          setViewMode('FEEDBACK_VIEW');
          setIsSidebarOpen(false);
        }}
        isReadingViewActive={viewMode === 'READING_VIEW' && !isSidebarOpen}
        isStatsActive={isSidebarOpen && sidebarTab === 'summary'}
        isFeedbackActive={viewMode === 'FEEDBACK_VIEW'}
      />

      {/* 3. Notifications banner */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-600">
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {actionErrorMsg && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-xs text-red-800 flex items-center justify-between animate-in fade-in">
          <span>{actionErrorMsg}</span>
          <button onClick={() => setActionErrorMsg(null)} className="text-red-600">
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Body Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Only render sidebar in reading view when toggled open */}
        {viewMode === 'READING_VIEW' && (
          <ReviewSidebar
            review={review}
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onScrollToItem={handleScrollToItem}
            filteredItems={filteredItems}
          />
        )}

        {/* 5. Center Reading Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
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

          {/* VIEW MODE 1: FEEDBACK VIEW (Centralized review feedback) */}
          {viewMode === 'FEEDBACK_VIEW' ? (
            <ReviewFeedbackStreamView
              review={review}
              items={filteredItems}
              isModeratorMode={isModeratorMode}
              onOpenSingleItemView={index => {
                setSingleItemIndex(index);
                setViewMode('SINGLE_ITEM_VIEW');
              }}
            />
          ) : viewMode === 'SINGLE_ITEM_VIEW' ? (
            <ReviewModeratorSingleView
              items={filteredItems}
              currentIndex={singleItemIndex}
              currentRevisionNumber={review.currentRevisionNumber}
              onNavigateIndex={setSingleItemIndex}
              onBackToReadingView={() => setViewMode('READING_VIEW')}
              renderHighlightedText={renderHighlightedText}
              onEditItem={item => setEditingItem(item)}
              onOpenPublishModal={() => setShowPublishRevisionModal(true)}
            />
          ) : (
            /* VIEW MODE 2: READING VIEW (All items list) */
            <>
              <ReviewItemList
                items={filteredItems}
                isApproverMode={isApproverMode}
                isReviewerMode={isReviewerMode}
                isModeratorMode={isModeratorMode}
                itemRefs={itemRefs}
                onOpenComments={setActiveCommentItem}
                onApprove={handleApprove}
                onReject={setActiveRejectItem}
                onToggleReviewed={handleToggleReviewed}
                onClearStatus={handleClearStatus}
                onOpenSingleItemView={index => {
                  setSingleItemIndex(index);
                  setViewMode('SINGLE_ITEM_VIEW');
                }}
                onOpenCompareEdits={item => setDiffModalItem(item)}
                renderHighlightedText={renderHighlightedText}
              />

              {/* 6. Footer Pagination Bar */}
              <ReviewPaginationBar totalCount={filteredItems.length} />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {/* 1. Comment Modal */}
      {activeCommentItem && (
        <ReviewCommentModal
          isOpen={!!activeCommentItem}
          onClose={() => {
            setActiveCommentItem(null);
            setSelectedText(null);
          }}
          reviewId={review.id}
          itemId={activeCommentItem.id}
          itemKey={activeCommentItem.itemKey}
          itemName={activeCommentItem.name}
          selectedText={selectedText || undefined}
          onClearSelectedText={() => setSelectedText(null)}
        />
      )}

      {/* 2. Mandatory Reject Reason Modal */}
      {activeRejectItem && (
        <RejectReasonModal
          isOpen={!!activeRejectItem}
          onClose={() => setActiveRejectItem(null)}
          itemKey={activeRejectItem.itemKey}
          itemName={activeRejectItem.name}
          onConfirm={handleRejectSubmit}
          isSubmitting={updateStatusMutation.isPending}
        />
      )}

      {/* 3. Add Participant / Moderator Modal */}
      <ReviewParticipantsModal
        isOpen={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        review={review}
      />

      {/* 4. Edit Item Modal (Direct editing inside review) */}
      {editingItem && (
        <ReviewItemEditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          reviewId={review.id}
          projectId={review.projectId}
          item={editingItem}
          onSaveSuccess={savedData => {
            // Đánh dấu pending edit với nội dung mới vừa lưu
            setPendingEditedMap(prev => ({
              ...prev,
              [editingItem.id]: {
                name: savedData?.name || editingItem.name,
                description: savedData?.description || editingItem.description,
                customFields: savedData?.customFields || editingItem.customFields,
              },
            }));
            setActionSuccessMsg(
              `Đã lưu thay đổi cho item ${editingItem.itemKey}. Nội dung review tiếp tục hiển thị bản Baseline của Revision V${review.currentRevisionNumber} và được đánh dấu Edited cho đến khi Publish new revision.`,
            );
            refetch();
          }}
        />
      )}

      {/* 5. Diff Edits Modal from reading view */}
      {diffModalItem && (
        <ReviewDiffEditsModal
          isOpen={!!diffModalItem}
          onClose={() => setDiffModalItem(null)}
          item={diffModalItem}
          currentRevisionNumber={review.currentRevisionNumber}
          onOpenPublishModal={() => {
            setDiffModalItem(null);
            setShowPublishRevisionModal(true);
          }}
        />
      )}

      {/* 6. Publish New Revision Modal */}
      {showPublishRevisionModal && (
        <ReviewPublishRevisionModal
          isOpen={showPublishRevisionModal}
          onClose={() => setShowPublishRevisionModal(false)}
          reviewId={review.id}
          currentRevisionNumber={review.currentRevisionNumber}
          editedItems={mergedItems.filter(i => i.hasUpdatedSinceLastRevision)}
          onPublishSuccess={() => {
            setPendingEditedMap({});
            setActionSuccessMsg(
              `Đã xuất bản thành công Revision V${review.currentRevisionNumber + 1}! Tất cả trạng thái phê duyệt đã được reset về Not Reviewed (QT-05).`,
            );
            refetch();
          }}
        />
      )}
    </div>
  );
};
