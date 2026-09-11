import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  itemKey?: string;
  itemName?: string;
  isSubmitting?: boolean;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemKey,
  itemName,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <h3 className="font-semibold text-sm">Reason for Rejection</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {itemKey && (
            <div className="text-xs text-slate-500">
              Rejecting item <span className="font-semibold text-slate-800">{itemKey}</span>
              {itemName ? `: ${itemName}` : ''}
            </div>
          )}

          <p className="text-xs text-slate-600">
            A comment explaining why this item needs changes is required before rejecting.
          </p>

          <div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why this item is rejected or what needs more work..."
              rows={4}
              required
              autoFocus
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Reject Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
