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
  Info,
} from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';
import { ReviewDiffEditsModal } from './ReviewDiffEditsModal';

interface ReviewModeratorSingleViewProps {
  items: ReviewItemReadingView[];
  currentIndex: number;
  currentRevisionNumber?: number;
  onNavigateIndex: (newIndex: number) => void;
  onBackToReadingView: () => void;
  renderHighlightedText: (text: string) => React.ReactNode;
  onEditItem?: (item: ReviewItemReadingView) => void;
  onOpenPublishModal?: () => void;
}

export const ReviewModeratorSingleView: React.FC<ReviewModeratorSingleViewProps> = ({
  items,
  currentIndex,
  currentRevisionNumber = 1,
  onNavigateIndex,
  onBackToReadingView,
  renderHighlightedText,
  onEditItem,
  onOpenPublishModal,
}) => {
  const [selectedBreakdownTab, setSelectedBreakdownTab] = useState<'APPROVED' | 'REJECTED'>(
    'REJECTED',
  );
  const [showDiffModal, setShowDiffModal] = useState(false);

  const currentItem = items[currentIndex];

  if (!currentItem) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
        No item selected.
      </div>
    );
  }

  const rejectedUsersList = currentItem.overallStatusSummary?.rejectedUsers || [];
  const approvedUsersList = currentItem.overallStatusSummary?.approvedUsers || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-bar: Back to review & Navigation controls matching screenshot Image 2 */}
      <div className="h-9 border-b border-slate-200 bg-slate-100/90 px-6 flex items-center justify-between text-xs text-slate-600 flex-shrink-0">
        <button
          onClick={onBackToReadingView}
          className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-600" />
          <span>Back to review</span>
        </button>

        {/* Item navigator controls: |<<  <  item [ 1 ] of 7  >  >>| */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            disabled={currentIndex === 0}
            onClick={() => onNavigateIndex(0)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 text-slate-600"
            title="First item"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={currentIndex === 0}
            onClick={() => onNavigateIndex(currentIndex - 1)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 text-slate-600"
            title="Previous item"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-600">item</span>
          <input
            type="text"
            value={currentIndex + 1}
            readOnly
            className="w-8 text-center py-0.5 border border-slate-300 rounded bg-white text-xs font-semibold text-slate-800"
          />
          <span className="text-slate-600">of {items.length}</span>
          <button
            disabled={currentIndex >= items.length - 1}
            onClick={() => onNavigateIndex(currentIndex + 1)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 text-slate-600"
            title="Next item"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={currentIndex >= items.length - 1}
            onClick={() => onNavigateIndex(items.length - 1)}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 text-slate-600"
            title="Last item"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main split area: Centered 2 containers */}
      <div className="flex-1 flex justify-center overflow-hidden bg-white">
        <div className="flex-1 max-w-5xl xl:max-w-6xl w-full flex overflow-hidden">
          {/* Left pane: Item document content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-5">
            <div className="space-y-2">
              {/* (i) Edited badge directly above title matching Image 1 */}
              {currentItem.hasUpdatedSinceLastRevision && (
                <div className="relative inline-block mb-1 group">
                  <button
                    onClick={() => setShowDiffModal(true)}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500 fill-slate-400 text-white" />
                    <span className="font-semibold text-[11px]">Edited</span>
                  </button>
                  {/* Tooltip matching Image 1 */}
                  <div className="hidden group-hover:block absolute left-0 top-full mt-1.5 z-50 bg-[#18181b] text-white text-[11px] rounded-md px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none leading-tight border border-slate-700">
                    <div className="font-medium">Publish new revision to view changes.</div>
                    <div className="text-slate-400">Click to compare.</div>
                    <div className="absolute -top-1 left-3 w-2 h-2 bg-[#18181b] rotate-45 border-l border-t border-slate-700" />
                  </div>
                </div>
              )}

              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {currentItem.itemKey} {renderHighlightedText(currentItem.name)}
              </h2>
              {currentItem.description && (
                <div
                  className="text-xs text-slate-800 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentItem.description }}
                />
              )}
            </div>

            {/* Structured custom fields */}
            {currentItem.customFields && Object.keys(currentItem.customFields).length > 0 && (
              <div className="border border-slate-200 rounded overflow-hidden mt-4">
                <table className="w-full text-xs divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(currentItem.customFields).map(([key, val]) => (
                      <tr key={key}>
                        <td className="w-48 px-3.5 py-2 bg-slate-50 font-semibold text-slate-600 border-r border-slate-200 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </td>
                        <td className="px-3.5 py-2 text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {renderHighlightedText(String(val))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right pane: Moderator Action Panel & Approval Breakdown matching Image 2 */}
          <div className="w-72 flex-shrink-0 border-l border-slate-200 bg-white p-4 space-y-5 overflow-y-auto">
            {/* Moderator Action Links */}
            <div className="space-y-1 text-xs text-slate-700 border-b border-slate-100 pb-3">
              <button
                onClick={() => onEditItem?.(currentItem)}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded hover:text-blue-600 transition-colors font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit item</span>
              </button>
              <button
                onClick={() => setShowDiffModal(true)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                  currentItem.hasUpdatedSinceLastRevision
                    ? 'hover:bg-amber-50 text-amber-900 font-semibold cursor-pointer'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <GitCompare
                  className={`w-3.5 h-3.5 ${
                    currentItem.hasUpdatedSinceLastRevision ? 'text-amber-600' : 'text-slate-400'
                  }`}
                />
                <span>View edits</span>
                {currentItem.hasUpdatedSinceLastRevision && (
                  <span className="ml-auto text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                    Pending
                  </span>
                )}
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
              {/* Two status buttons: Approved & Rejected matching screenshot Image 2 */}
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded text-xs font-semibold">
                <button
                  onClick={() => setSelectedBreakdownTab('APPROVED')}
                  className={`py-1.5 text-center rounded transition-all ${
                    selectedBreakdownTab === 'APPROVED'
                      ? 'bg-slate-200 text-slate-800'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setSelectedBreakdownTab('REJECTED')}
                  className={`py-1.5 text-center rounded transition-all ${
                    selectedBreakdownTab === 'REJECTED'
                      ? 'bg-[#d9383a] text-white shadow-2xs font-bold'
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
                  <span className="px-2 py-0.5 rounded bg-[#48bb78] text-white font-bold text-[10px] flex items-center justify-center">
                    {currentItem.overallStatusSummary?.approvedCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Rejected</span>
                  <span className="px-2 py-0.5 rounded bg-[#d9383a] text-white font-bold text-[10px] flex items-center justify-center">
                    {currentItem.overallStatusSummary?.rejectedCount || 0}
                  </span>
                </div>
              </div>

              {/* Detailed Users List for selected tab */}
              <div className="pt-2 space-y-2">
                {selectedBreakdownTab === 'REJECTED' && (
                  <>
                    {rejectedUsersList.length > 0 ? (
                      rejectedUsersList.map(u => (
                        <div
                          key={u.userId}
                          className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100 text-xs text-slate-800"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-700 flex-shrink-0 overflow-hidden">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              u.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="truncate font-medium">{u.fullName}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 italic py-2 text-center">
                        No rejections recorded yet.
                      </div>
                    )}
                  </>
                )}

                {selectedBreakdownTab === 'APPROVED' && (
                  <>
                    {approvedUsersList.length > 0 ? (
                      approvedUsersList.map(u => (
                        <div
                          key={u.userId}
                          className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100 text-xs text-slate-800"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 overflow-hidden">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              u.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="truncate font-medium">{u.fullName}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 italic py-2 text-center">
                        No approvals recorded yet.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diff Edits Modal */}
      <ReviewDiffEditsModal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        item={currentItem}
        currentRevisionNumber={currentRevisionNumber}
        onOpenPublishModal={onOpenPublishModal}
      />
    </div>
  );
};
