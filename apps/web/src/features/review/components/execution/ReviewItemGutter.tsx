import React from 'react';
import {
  Check,
  X as CloseIcon,
  MinusCircle,
  MessageSquare,
  Square,
  CheckSquare,
} from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';

interface ReviewItemGutterProps {
  item: ReviewItemReadingView;
  index: number;
  isSelected: boolean;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  isModeratorMode: boolean;
  onToggleSelect: (itemId: string) => void;
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
  isSelected,
  isApproverMode,
  isReviewerMode,
  isModeratorMode,
  onToggleSelect,
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

  return (
    <div className="w-32 flex-shrink-0 flex items-center justify-start gap-1.5 pt-0.5">
      {/* 1. Item Selection Checkbox for Batch actions */}
      <button
        onClick={() => onToggleSelect(item.id)}
        className={`p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
          isSelected ? 'text-blue-600' : ''
        }`}
        title={isSelected ? 'Deselect item' : 'Select item for batch actions'}
      >
        {isSelected ? (
          <CheckSquare className="w-4 h-4 text-blue-600" />
        ) : (
          <Square className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* 2. Comment Bubble with count */}
      <button
        onClick={() => onOpenComments(item)}
        className={`flex items-center justify-center rounded transition-colors ${
          item.commentCount > 0
            ? 'w-5 h-5 bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold text-[10px] shadow-2xs'
            : 'w-5 h-5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 border border-slate-200'
        }`}
        title={`${item.commentCount} comments`}
      >
        {item.commentCount > 0 ? (
          item.commentCount
        ) : (
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* 3. Approver Actions (Approve [✓], Reject [✕], Clear [⊝]) */}
      {isApproverMode && (
        <div className="flex items-center gap-1">
          {/* Approve Button: Checked -> Highlight xanh lá, Chưa checked -> Icon xám (KHÔNG DÙNG DẠNG CHECKBOX) */}
          <button
            onClick={() => onApprove?.(item)}
            title={
              isItemApproved
                ? 'Đã duyệt (Approve) - Click để hủy'
                : 'Duyệt (Approve item)'
            }
            className="p-1 rounded hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <Check
              className={`w-4 h-4 transition-colors ${
                isItemApproved
                  ? 'text-emerald-600 stroke-[3] drop-shadow-sm'
                  : 'text-slate-300 hover:text-emerald-600 stroke-[2.5]'
              }`}
            />
          </button>

          {/* Reject Button: Checked -> Highlight đỏ, Chưa checked -> Icon xám */}
          <button
            onClick={() => onReject?.(item)}
            title={
              isItemRejected
                ? 'Đã từ chối (Rejected) - Click để hủy'
                : 'Từ chối (Reject item)'
            }
            className="p-1 rounded hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <CloseIcon
              className={`w-4 h-4 transition-colors ${
                isItemRejected
                  ? 'text-red-600 stroke-[3] drop-shadow-sm'
                  : 'text-slate-300 hover:text-red-600 stroke-[2.5]'
              }`}
            />
          </button>

          {/* Clear Button */}
          <button
            onClick={() => onClearStatus(item)}
            title="Bỏ đánh dấu (Clear status)"
            className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <MinusCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Reviewer Action matching screenshot [13:04]: [ ✓ ] [ ⊝ ] */}
      {isReviewerMode && (
        <div className="flex items-center gap-1">
          {/* Reviewed Button: Checked -> Highlight xanh lá, Chưa checked -> Icon xám (KHÔNG DÙNG DẠNG CHECKBOX) */}
          <button
            onClick={() => onToggleReviewed?.(item)}
            title={
              isItemReviewed
                ? 'Đã xem (Reviewed) - Click để bỏ đánh dấu'
                : 'Đánh dấu là đã xem (Reviewed)'
            }
            className="p-1 rounded hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <Check
              className={`w-4 h-4 transition-colors ${
                isItemReviewed
                  ? 'text-emerald-600 stroke-[3] drop-shadow-sm'
                  : 'text-slate-300 hover:text-emerald-600 stroke-[2.5]'
              }`}
            />
          </button>

          {/* Reset / Clear status */}
          <button
            onClick={() => onClearStatus(item)}
            title="Bỏ đánh dấu (Clear status)"
            className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <MinusCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5. Moderator Overall Status Badge */}
      {isModeratorMode && (
        <div className="flex items-center">
          {item.overallStatusSummary &&
          item.overallStatusSummary.rejectedCount > 0 ? (
            <button
              onClick={() => onOpenSingleItemView(index)}
              title={`${item.overallStatusSummary.rejectedCount} participant(s) rejected this item. Click to view breakdown`}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 transition-colors"
            >
              Needs work ({item.overallStatusSummary.rejectedCount})
            </button>
          ) : item.overallStatusSummary &&
            item.overallStatusSummary.approvedCount ===
              item.overallStatusSummary.totalApprovers &&
            item.overallStatusSummary.totalApprovers > 0 ? (
            <button
              onClick={() => onOpenSingleItemView(index)}
              title="Approved by all approvers"
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 transition-colors"
            >
              <Check className="w-3 h-3 stroke-[3]" /> All Approved
            </button>
          ) : item.overallStatusSummary &&
            item.overallStatusSummary.approvedCount > 0 ? (
            <button
              onClick={() => onOpenSingleItemView(index)}
              title={`${item.overallStatusSummary.approvedCount} of ${item.overallStatusSummary.totalApprovers} approvers approved`}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            >
              {item.overallStatusSummary.approvedCount}/
              {item.overallStatusSummary.totalApprovers} Approved
            </button>
          ) : (
            <button
              onClick={() => onOpenSingleItemView(index)}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-colors"
            >
              Pending
            </button>
          )}
        </div>
      )}
    </div>
  );
};
