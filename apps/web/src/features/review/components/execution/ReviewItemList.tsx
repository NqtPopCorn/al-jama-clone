import React, { useState } from 'react';
import { Calendar, Edit2, Info } from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';
import { ReviewItemGutter } from './ReviewItemGutter';

interface ReviewItemListProps {
  items: ReviewItemReadingView[];
  isApproverMode: boolean;
  isReviewerMode: boolean;
  isModeratorMode: boolean;
  itemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onOpenComments: (item: ReviewItemReadingView) => void;
  onApprove?: (item: ReviewItemReadingView) => void;
  onReject?: (item: ReviewItemReadingView) => void;
  onToggleReviewed?: (item: ReviewItemReadingView) => void;
  onClearStatus: (item: ReviewItemReadingView) => void;
  onOpenSingleItemView: (index: number) => void;
  onOpenCompareEdits?: (item: ReviewItemReadingView) => void;
  renderHighlightedText: (text: string) => React.ReactNode;
}

export const ReviewItemList: React.FC<ReviewItemListProps> = ({
  items,
  isApproverMode,
  isReviewerMode,
  isModeratorMode,
  itemRefs,
  onOpenComments,
  onApprove,
  onReject,
  onToggleReviewed,
  onClearStatus,
  onOpenSingleItemView,
  onOpenCompareEdits,
  renderHighlightedText,
}) => {
  const [collapsedItemIds, setCollapsedItemIds] = useState<Set<string>>(new Set());

  const handleToggleCollapse = (itemId: string) => {
    setCollapsedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-16 text-center text-xs text-slate-400 italic">
        No items match the current filter or search criteria.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
      {items.map((item, index) => {
        const isCollapsed = collapsedItemIds.has(item.id);

        return (
          <div
            key={item.id}
            ref={el => (itemRefs.current[item.id] = el)}
            className="flex items-start gap-3 group pb-5 border-b border-slate-100 last:border-b-0"
          >
            {/* Left Gutter: Comment button, Approve badge, Reject badge, Toggle collapse */}
            <div className="flex-shrink-0 pt-0.5">
              <ReviewItemGutter
                item={item}
                index={index}
                isApproverMode={isApproverMode}
                isReviewerMode={isReviewerMode}
                isModeratorMode={isModeratorMode}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => handleToggleCollapse(item.id)}
                onOpenComments={onOpenComments}
                onApprove={onApprove}
                onReject={onReject}
                onToggleReviewed={onToggleReviewed}
                onClearStatus={onClearStatus}
                onOpenSingleItemView={onOpenSingleItemView}
              />
            </div>

            {/* Right: Item Body */}
            <div className="flex-1 min-w-0">
              {/* (i) Edited badge directly above title matching Image 2 */}
              {item.hasUpdatedSinceLastRevision && (
                <div className="relative inline-block mb-1.5 group">
                  <button
                    onClick={() =>
                      onOpenCompareEdits ? onOpenCompareEdits(item) : onOpenSingleItemView(index)
                    }
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500 fill-slate-400 text-white" />
                    <span className="font-semibold text-[11px]">Edited</span>
                  </button>
                  {/* Tooltip matching Image 1 & 2 */}
                  <div className="hidden group-hover:block absolute left-0 top-full mt-1.5 z-50 bg-[#18181b] text-white text-[11px] rounded-md px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none leading-tight border border-slate-700">
                    <div className="font-medium">Publish new revision to view changes.</div>
                    <div className="text-slate-400">Click to compare.</div>
                    <div className="absolute -top-1 left-3 w-2 h-2 bg-[#18181b] rotate-45 border-l border-t border-slate-700" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                <h3
                  onClick={() => onOpenSingleItemView(index)}
                  className="font-bold text-sm text-slate-900 leading-snug hover:text-blue-600 hover:underline cursor-pointer"
                >
                  <span className="font-mono text-xs font-bold text-slate-800 mr-2">
                    {item.itemKey}
                  </span>
                  {renderHighlightedText(item.name)}
                </h3>
              </div>

              {/* Collapsible content (Description, custom fields) */}
              {!isCollapsed && (
                <div className="mt-1 space-y-2">
                  {/* Description rendered as rich text HTML */}
                  {item.description && (
                    <div
                      className="text-xs text-slate-800 leading-relaxed prose prose-sm max-w-none py-1"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  )}

                  {/* Custom fields or attributes */}
                  {item.customFields && Object.keys(item.customFields).length > 0 && (
                    <div className="border border-slate-200 rounded overflow-hidden mt-2">
                      <table className="w-full text-xs divide-y divide-slate-200">
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(item.customFields).map(([key, val]) => (
                            <tr key={key}>
                              <td className="w-40 px-3 py-2 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200 capitalize">
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
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
