import React from 'react';
import { Check, X as CloseIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';

// Speech bubble or count button matching Jama Connect screenshots
export const CommentBubbleButton: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => {
  if (count > 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`${count} comment${count > 1 ? 's' : ''} - Click to open`}
        className="w-5 h-5 rounded-xs bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs transition-colors cursor-pointer flex-shrink-0"
      >
        {count}
      </button>
    );
  }

  // When count is 0: empty speech bubble outline matching Image 1
  return (
    <button
      type="button"
      onClick={onClick}
      title="Add comment"
      className="w-5 h-5 rounded-xs flex items-center justify-center transition-transform active:scale-95 focus:outline-hidden flex-shrink-0 hover:bg-slate-100 cursor-pointer"
    >
      <svg width="20" height="18" viewBox="0 0 24 22" fill="none">
        <path
          d="M 2 3 C 2 1.3 3.3 0 5 0 L 19 0 C 20.7 0 22 1.3 22 3 L 22 13 C 22 14.7 20.7 16 19 16 L 8 16 L 4 20 L 4 16 L 4 16 C 2.3 16 2 14.7 2 13 Z"
          fill="#ffffff"
          stroke="#0284c7"
          strokeWidth="1.6"
          className="hover:stroke-blue-700 transition-colors"
        />
      </svg>
    </button>
  );
};

interface ReviewItemGutterProps {
  item: ReviewItemReadingView;
  index: number;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  isModeratorMode: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenComments: (item: ReviewItemReadingView) => void;
  onApprove?: (item: ReviewItemReadingView) => void;
  onReject?: (item: ReviewItemReadingView) => void;
  onToggleReviewed?: (item: ReviewItemReadingView) => void;
  onClearStatus: (item: ReviewItemReadingView) => void;
  onOpenSingleItemView: (index: number) => void;
}

export const ReviewItemGutter: React.FC<ReviewItemGutterProps> = ({
  item,
  index,
  isApproverMode,
  isReviewerMode,
  isModeratorMode,
  isCollapsed = false,
  onToggleCollapse,
  onOpenComments,
  onApprove,
  onReject,
  onToggleReviewed,
  onClearStatus,
  onOpenSingleItemView,
}) => {
  const isItemApproved = item.status === 'APPROVED';
  const isItemRejected = item.status === 'REJECTED';
  const isItemReviewed = item.status === 'REVIEWED';

  const approvedCount = item.overallStatusSummary?.approvedCount ?? (isItemApproved ? 1 : 0);
  const rejectedCount = item.overallStatusSummary?.rejectedCount ?? (isItemRejected ? 1 : 0);

  return (
    <div className="flex-shrink-0 flex items-center justify-start gap-1.5 pt-0.5 select-none">
      {/* 1. NÚT XEM COMMENT (Image 1: outline bubble khi 0 comment, Image 2: [ 4 ] xanh dương khi có comment) */}
      <CommentBubbleButton count={item.commentCount} onClick={() => onOpenComments(item)} />

      {/* 2. BADGE SỐ APPROVE (Image 2: ô 0 khi 0 approve, xanh lá khi có approve) */}
      {isApproverMode ? (
        <button
          type="button"
          onClick={() => onApprove?.(item)}
          title={isItemApproved ? 'Approved (Click to undo)' : 'Approve (0 approvals)'}
          className={`w-5 h-5 rounded-xs flex items-center justify-center text-[11px] font-bold border transition-colors cursor-pointer ${
            isItemApproved || approvedCount > 0
              ? 'bg-[#16a34a] border-[#16a34a] text-white hover:bg-emerald-700'
              : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          {isItemApproved ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : approvedCount > 0 ? (
            approvedCount
          ) : (
            '0'
          )}
        </button>
      ) : isReviewerMode ? (
        <button
          type="button"
          onClick={() => onToggleReviewed?.(item)}
          title={isItemReviewed ? 'Marked as reviewed (Click to undo)' : 'Mark as reviewed'}
          className={`w-5 h-5 rounded-xs flex items-center justify-center text-[11px] font-bold border transition-colors cursor-pointer ${
            isItemReviewed
              ? 'bg-[#16a34a] border-[#16a34a] text-white hover:bg-emerald-700'
              : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600'
          }`}
        >
          {isItemReviewed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '0'}
        </button>
      ) : /* Moderator Mode: Badge số approve */
      approvedCount > 0 ? (
        <button
          type="button"
          onClick={() => onOpenSingleItemView(index)}
          title={`${approvedCount} approval${approvedCount > 1 ? 's' : ''}. Click to view details`}
          className="w-5 h-5 rounded-xs bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
        >
          {approvedCount}
        </button>
      ) : (
        <div
          title="0 approvals"
          className="w-5 h-5 rounded-xs border border-slate-300 bg-white flex items-center justify-center text-[11px] font-semibold text-slate-600"
        >
          0
        </div>
      )}

      {/* 3. BADGE SỐ REJECT (Image 2: [ 2 ] màu đỏ khi có reject, ô 0 khi 0 reject) */}
      {isApproverMode ? (
        <button
          type="button"
          onClick={() => onReject?.(item)}
          title={isItemRejected ? 'Rejected (Click to undo)' : 'Reject (0 rejections)'}
          className={`w-5 h-5 rounded-xs flex items-center justify-center text-[11px] font-bold border transition-colors cursor-pointer ${
            isItemRejected || rejectedCount > 0
              ? 'bg-[#e11d48] border-[#e11d48] text-white hover:bg-red-700'
              : 'bg-white border-slate-300 text-slate-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
          }`}
        >
          {isItemRejected ? (
            <CloseIcon className="w-3.5 h-3.5 stroke-[3]" />
          ) : rejectedCount > 0 ? (
            rejectedCount
          ) : (
            '0'
          )}
        </button>
      ) : /* Moderator & Reviewer Mode: Badge số reject */
      rejectedCount > 0 ? (
        <button
          type="button"
          onClick={() => onOpenSingleItemView(index)}
          title={`${rejectedCount} rejection${rejectedCount > 1 ? 's' : ''}. Click to view details`}
          className="w-5 h-5 rounded-xs bg-[#e11d48] hover:bg-red-700 text-white font-bold text-[11px] flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
        >
          {rejectedCount}
        </button>
      ) : (
        <div
          title="0 rejections"
          className="w-5 h-5 rounded-xs border border-slate-300 bg-white flex items-center justify-center text-[11px] font-semibold text-slate-600"
        >
          0
        </div>
      )}

      {/* 4. NÚT TOGGLE THU GỌN ITEM (▼ khi mở rộng, ▶ khi thu gọn) */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expand item' : 'Collapse item'}
        className="w-5 h-5 rounded-xs hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
