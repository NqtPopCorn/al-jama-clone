import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, Calendar, Bell, Loader2 } from 'lucide-react';
import { ReviewItemReadingView } from '@aljama/shared';
import { usePublishRevisionMutation } from '../../hooks/useReviewApi';

interface ReviewPublishRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  currentRevisionNumber: number;
  editedItems: ReviewItemReadingView[];
  onPublishSuccess: () => void;
}

export const ReviewPublishRevisionModal: React.FC<ReviewPublishRevisionModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  currentRevisionNumber,
  editedItems,
  onPublishSuccess,
}) => {
  const [changeDescription, setChangeDescription] = useState(
    'Cập nhật nội dung item theo feedback của các approver và reviewer.',
  );
  const [deadline, setDeadline] = useState('');
  const [notifyParticipants, setNotifyParticipants] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const publishMutation = usePublishRevisionMutation();

  if (!isOpen) return null;

  const nextRevision = currentRevisionNumber + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await publishMutation.mutateAsync({
        reviewId,
        dto: {
          changeDescription: changeDescription.trim() || `Revision ${nextRevision} published`,
          deadline: deadline || undefined,
          notifyParticipants,
        },
      });

      onPublishSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể xuất bản revision mới. Vui lòng thử lại.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              V{nextRevision}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Publish Revision {nextRevision}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chuyển đợt review từ Revision V{currentRevisionNumber} sang V{nextRevision}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {/* Rule QT-05 Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Quy tắc QT-05 (Publish Revision):</span>
              </div>
              <p className="leading-relaxed">Khi bạn Publish revision mới:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-800 font-normal">
                <li>
                  Tất cả các item đã chỉnh sửa sẽ chính thức cập nhật nội dung cho V{nextRevision}.
                </li>
                <li>
                  Dấu đánh dấu <b>Edited</b> sẽ được gỡ bỏ.
                </li>
                <li>
                  Toán bộ trạng thái phê duyệt (Approved/Rejected) của các participant sẽ được{' '}
                  <b>reset về Chưa xem (Not Reviewed)</b> để họ xem lại nội dung mới.
                </li>
              </ul>
            </div>

            {/* Edited items summary */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Các item có thay đổi ({editedItems.length})
              </label>
              <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-36 overflow-y-auto bg-slate-50/50">
                {editedItems.length > 0 ? (
                  editedItems.map(item => (
                    <div
                      key={item.id}
                      className="px-3 py-2 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono font-bold text-slate-700 flex-shrink-0">
                          {item.itemKey}
                        </span>
                        <span className="text-slate-800 truncate">
                          {item.editedContent?.name || item.name}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
                        V{nextRevision}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-3 text-xs text-slate-400 italic text-center">
                    Tất cả các item đều sẽ được snapshot baseline cho Revision V{nextRevision}.
                  </div>
                )}
              </div>
            </div>

            {/* Change Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú thay đổi (Revision change notes) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={changeDescription}
                onChange={e => setChangeDescription(e.target.value)}
                required
                rows={3}
                placeholder="Mô tả tóm tắt các thay đổi trong revision mới này..."
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden leading-relaxed"
              />
            </div>

            {/* Optional deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Hạn chót mới (Tùy chọn)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            </div>

            {/* Email notification toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={notifyParticipants}
                  onChange={e => setNotifyParticipants(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Gửi email thông báo cho toàn bộ participants về Revision V{nextRevision}
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={publishMutation.isPending}
              className="px-4 py-1.5 bg-[#0070ba] hover:bg-[#005a96] disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang publish...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Revision V{nextRevision}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
