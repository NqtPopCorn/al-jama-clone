import React from 'react';
import { X, GitCompare, ArrowRight, CheckCircle2, Clock, FileText } from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';

interface ReviewDiffEditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ReviewItemReadingView;
  currentRevisionNumber: number;
  onOpenPublishModal?: () => void;
}

export const ReviewDiffEditsModal: React.FC<ReviewDiffEditsModalProps> = ({
  isOpen,
  onClose,
  item,
  currentRevisionNumber,
  onOpenPublishModal,
}) => {
  if (!isOpen) return null;

  const baselineName = item.baselineContent?.name || item.name;
  const editedName = item.editedContent?.name || item.name;
  const isNameChanged = baselineName !== editedName;

  const baselineDesc = item.baselineContent?.description || item.description || '';
  const editedDesc = item.editedContent?.description || item.description || '';
  const isDescChanged = baselineDesc !== editedDesc;

  const baselineCustom = item.baselineContent?.customFields || item.customFields || {};
  const editedCustom = item.editedContent?.customFields || item.customFields || {};
  const allCustomKeys = Array.from(
    new Set([...Object.keys(baselineCustom), ...Object.keys(editedCustom)]),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700">{item.itemKey}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Edited (Pending Revision V{currentRevisionNumber + 1})
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Compare Edits: {baselineName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative notice bar */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-2.5 text-xs text-amber-900 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">
              Nội dung chưa được hiển thị chính thức cho người review:
            </span>{' '}
            Hiện tại các Approver và Reviewer vẫn đang xem bản Baseline của Revision V
            {currentRevisionNumber}. Nội dung chỉnh sửa bên dưới sẽ chỉ được áp dụng và hiển thị
            chính thức sau khi bạn bấm{' '}
            <span className="font-semibold text-amber-950">Publish new revision</span>.
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Version Header Column Labels */}
          <div className="grid grid-cols-2 gap-6 font-semibold text-xs pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Revision V{currentRevisionNumber} Baseline (Current In Review)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pending Edited Content (Pending Revision V{currentRevisionNumber + 1})</span>
            </div>
          </div>

          {/* 1. Item Name Diff */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Item Name</span>
              {isNameChanged && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Modified
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800">
                {baselineName}
              </div>
              <div
                className={`p-3 rounded font-medium ${
                  isNameChanged
                    ? 'bg-emerald-50/70 border border-emerald-300 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                {editedName}
              </div>
            </div>
          </div>

          {/* 2. Description Diff */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Description / Specification</span>
              {isDescChanged && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Modified
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-slate-700 whitespace-pre-wrap leading-relaxed">
                {baselineDesc || <span className="italic text-slate-400">No description</span>}
              </div>
              <div
                className={`p-4 rounded whitespace-pre-wrap leading-relaxed ${
                  isDescChanged
                    ? 'bg-emerald-50/60 border border-emerald-300 text-slate-900 font-normal'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {editedDesc || <span className="italic text-slate-400">No description</span>}
              </div>
            </div>
          </div>

          {/* 3. Custom Fields Diff (if any) */}
          {allCustomKeys.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Custom Fields / Attributes
              </div>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2 text-left w-1/4">Field</th>
                      <th className="px-3.5 py-2 text-left w-3/8">
                        Revision V{currentRevisionNumber} Baseline
                      </th>
                      <th className="px-3.5 py-2 text-left w-3/8">Pending Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allCustomKeys.map(key => {
                      const bVal = (baselineCustom as Record<string, any>)[key];
                      const eVal = (editedCustom as Record<string, any>)[key];
                      const isChanged = JSON.stringify(bVal) !== JSON.stringify(eVal);

                      return (
                        <tr key={key} className={isChanged ? 'bg-amber-50/40' : undefined}>
                          <td className="px-3.5 py-2 font-medium text-slate-700 capitalize border-r border-slate-200">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </td>
                          <td className="px-3.5 py-2 text-slate-600 border-r border-slate-200">
                            {String(bVal ?? '—')}
                          </td>
                          <td
                            className={`px-3.5 py-2 ${
                              isChanged ? 'text-emerald-900 font-semibold' : 'text-slate-600'
                            }`}
                          >
                            {String(eVal ?? '—')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            {onOpenPublishModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPublishModal();
                }}
                className="px-4 py-2 bg-[#0070ba] hover:bg-[#005a96] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>Publish new revision...</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
