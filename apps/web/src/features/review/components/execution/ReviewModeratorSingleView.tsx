import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  GitCompare,
  MinusCircle,
  Bell,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';

interface ReviewModeratorSingleViewProps {
  items: ReviewItemReadingView[];
  currentIndex: number;
  onNavigateIndex: (newIndex: number) => void;
  onBackToReadingView: () => void;
  renderHighlightedText: (text: string) => React.ReactNode;
}

export const ReviewModeratorSingleView: React.FC<ReviewModeratorSingleViewProps> = ({
  items,
  currentIndex,
  onNavigateIndex,
  onBackToReadingView,
  renderHighlightedText,
}) => {
  const [selectedBreakdownTab, setSelectedBreakdownTab] = useState<'APPROVED' | 'REJECTED'>(
    'REJECTED',
  );

  const currentItem = items[currentIndex];

  if (!currentItem) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
        No item selected.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-bar: Back to review & Navigation controls matching screenshot [17:06] */}
      <div className="h-9 border-b border-slate-200 bg-slate-100/90 px-6 flex items-center justify-between text-xs text-slate-600 flex-shrink-0">
        <button
          onClick={onBackToReadingView}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to review</span>
        </button>

        {/* Item navigator controls: |<<  <  Item X of N  >  >>| */}
        <div className="flex items-center gap-2">
          <button
            disabled={currentIndex === 0}
            onClick={() => onNavigateIndex(0)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
            title="First item"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={currentIndex === 0}
            onClick={() => onNavigateIndex(currentIndex - 1)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
            title="Previous item"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-slate-700 px-2">
            Item {currentIndex + 1} of {items.length}
          </span>
          <button
            disabled={currentIndex >= items.length - 1}
            onClick={() => onNavigateIndex(currentIndex + 1)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
            title="Next item"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={currentIndex >= items.length - 1}
            onClick={() => onNavigateIndex(items.length - 1)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
            title="Last item"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main split area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Item document content */}
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-6">
          <div className="space-y-2">
            <div className="font-mono text-sm font-bold text-slate-900">
              {currentItem.itemKey} {currentItem.name}
            </div>
            {currentItem.description && (
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {renderHighlightedText(currentItem.description)}
              </div>
            )}
          </div>

          {/* Structured custom fields */}
          {currentItem.customFields &&
            Object.keys(currentItem.customFields).length > 0 && (
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(currentItem.customFields).map(([key, val]) => (
                      <tr key={key}>
                        <td className="w-40 px-4 py-2.5 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </td>
                        <td className="px-4 py-2.5 text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {renderHighlightedText(String(val))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          <div className="pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
            <span>
              ID: <strong className="text-slate-700">{currentItem.itemKey}</strong>
            </span>
            <span>
              Type:{' '}
              <strong className="text-slate-700">
                {currentItem.itemTypeName || 'Requirement'}
              </strong>
            </span>
          </div>
        </div>

        {/* Right pane: Moderator Action Panel & Approval Breakdown matching screenshot */}
        <div className="w-72 flex-shrink-0 border-l border-slate-200 bg-white p-4 space-y-5 overflow-y-auto">
          {/* Moderator Action Links */}
          <div className="space-y-1 text-xs text-slate-700 border-b border-slate-100 pb-3">
            <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded hover:text-blue-600 transition-colors">
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit item</span>
            </button>
            <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded hover:text-blue-600 transition-colors">
              <GitCompare className="w-3.5 h-3.5 text-slate-400" />
              <span>View edits</span>
            </button>
            <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 rounded hover:text-red-600 transition-colors">
              <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Remove</span>
            </button>
            <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded hover:text-blue-600 transition-colors">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Unsubscribe</span>
            </button>
            <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded hover:text-blue-600 transition-colors">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>View in tree</span>
            </button>
            <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded hover:text-blue-600 transition-colors">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Go to item</span>
            </button>
          </div>

          {/* Approval & Rejection Breakdown Box */}
          <div className="space-y-3">
            {/* Two large tabs: Approved & Rejected */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedBreakdownTab('APPROVED')}
                className={`py-1.5 text-center font-semibold rounded transition-all ${
                  selectedBreakdownTab === 'APPROVED'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setSelectedBreakdownTab('REJECTED')}
                className={`py-1.5 text-center font-semibold rounded transition-all ${
                  selectedBreakdownTab === 'REJECTED'
                    ? 'bg-[#d9383a] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Rejected
              </button>
            </div>

            {/* Count summary rows */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Approved</span>
                <span className="w-5 h-5 rounded bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">
                  {currentItem.overallStatusSummary?.approvedCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Rejected</span>
                <span className="w-5 h-5 rounded bg-[#d9383a] text-white font-bold text-[10px] flex items-center justify-center">
                  {currentItem.overallStatusSummary?.rejectedCount || 0}
                </span>
              </div>
            </div>

            {/* Detailed Users List for selected tab */}
            <div className="pt-2 space-y-2">
              {selectedBreakdownTab === 'REJECTED' && (
                <>
                  {currentItem.overallStatusSummary?.rejectedUsers &&
                  currentItem.overallStatusSummary.rejectedUsers.length > 0 ? (
                    currentItem.overallStatusSummary.rejectedUsers.map(u => (
                      <div
                        key={u.userId}
                        className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100 text-xs text-slate-800"
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-700 flex-shrink-0 overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="truncate font-medium">{u.fullName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 italic py-2 text-center">
                      No rejections for this item.
                    </div>
                  )}
                </>
              )}

              {selectedBreakdownTab === 'APPROVED' && (
                <>
                  {currentItem.overallStatusSummary?.approvedUsers &&
                  currentItem.overallStatusSummary.approvedUsers.length > 0 ? (
                    currentItem.overallStatusSummary.approvedUsers.map(u => (
                      <div
                        key={u.userId}
                        className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100 text-xs text-slate-800"
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="truncate font-medium">{u.fullName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 italic py-2 text-center">
                      No approvals yet.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
