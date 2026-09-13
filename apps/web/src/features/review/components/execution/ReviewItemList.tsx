import React from 'react';
import { Calendar } from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';
import { ReviewItemGutter } from './ReviewItemGutter';

interface ReviewItemListProps {
  items: ReviewItemReadingView[];
  selectedItemIds: Set<string>;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  isModeratorMode: boolean;
  itemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onToggleSelect: (itemId: string) => void;
  onOpenComments: (item: ReviewItemReadingView) => void;
  onApprove?: (item: ReviewItemReadingView) => void;
  onReject?: (item: ReviewItemReadingView) => void;
  onToggleReviewed?: (item: ReviewItemReadingView) => void;
  onClearStatus: (item: ReviewItemReadingView) => void;
  onOpenSingleItemView: (index: number) => void;
  renderHighlightedText: (text: string) => React.ReactNode;
}

export const ReviewItemList: React.FC<ReviewItemListProps> = ({
  items,
  selectedItemIds,
  isApproverMode,
  isReviewerMode,
  isModeratorMode,
  itemRefs,
  onToggleSelect,
  onOpenComments,
  onApprove,
  onReject,
  onToggleReviewed,
  onClearStatus,
  onOpenSingleItemView,
  renderHighlightedText,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-16 text-center text-xs text-slate-400 italic">
        No items match the current filter or search criteria.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-5xl mx-auto w-full">
      {items.map((item, index) => {
        const isSelected = selectedItemIds.has(item.id);

        return (
          <div
            key={item.id}
            ref={el => (itemRefs.current[item.id] = el)}
            className="flex gap-4 group pb-6 border-b border-slate-100 last:border-b-0"
          >
            {/* Left Gutter */}
            <ReviewItemGutter
              item={item}
              index={index}
              isSelected={isSelected}
              isApproverMode={isApproverMode}
              isReviewerMode={isReviewerMode}
              isModeratorMode={isModeratorMode}
              onToggleSelect={onToggleSelect}
              onOpenComments={onOpenComments}
              onApprove={onApprove}
              onReject={onReject}
              onToggleReviewed={onToggleReviewed}
              onClearStatus={onClearStatus}
              onOpenSingleItemView={onOpenSingleItemView}
            />

            {/* Right: Item Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-slate-800">
                  {item.itemKey}
                </span>
                <h3
                  onClick={() => onOpenSingleItemView(index)}
                  className="font-bold text-sm text-slate-900 leading-snug hover:text-blue-600 hover:underline cursor-pointer"
                >
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

              {/* Custom fields or description */}
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
      })}
    </div>
  );
};
