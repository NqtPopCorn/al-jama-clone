import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface ReviewResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  commentId: string;
  commentAuthor?: string;
  commentLabel?: string;
  commentContent: string;
  selectedText?: string | null;
  onConfirm: (commentId: string, note: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const ReviewResolveModal: React.FC<ReviewResolveModalProps> = ({
  isOpen,
  onClose,
  commentId,
  commentAuthor,
  commentLabel,
  commentContent,
  selectedText,
  onConfirm,
  isSubmitting = false,
}) => {
  const [note, setNote] = useState('Đã áp dụng thay đổi');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(commentId, note.trim());
    onClose();
  };

  const quickNotes = [
    'Đã áp dụng thay đổi',
    'Đã cập nhật nội dung item theo đề xuất',
    'Đã thảo luận và thống nhất giải pháp',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-in fade-in duration-150 backdrop-blur-2xs">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-xs text-slate-800 tracking-wide">
              Resolve {commentLabel ? commentLabel.replace('_', ' ') : 'Feedback'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Comment quote context */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700">{commentAuthor || 'Participant'}</span>
              {commentLabel && (
                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                  {commentLabel}
                </span>
              )}
            </div>

            {selectedText && (
              <div className="border-l-2 border-amber-400 pl-2 text-slate-700 italic">
                <span className="bg-amber-200 text-amber-900 font-semibold px-1 rounded not-italic">
                  {selectedText}
                </span>
              </div>
            )}

            <p className="text-slate-800">{commentContent}</p>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Ghi chú xử lý (Resolution Note):
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="VD: Đã áp dụng thay đổi vào nội dung item..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              autoFocus
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickNotes.map(qn => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  {qn}
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận Resolve'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
