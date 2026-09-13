import React from 'react';
import { Users, X as CloseIcon } from 'lucide-react';
import { ReviewDetail } from '@aljama/shared';

interface ReviewParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewDetail;
}

export const ReviewParticipantsModal: React.FC<ReviewParticipantsModalProps> = ({
  isOpen,
  onClose,
  review,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Review Participants & Roles
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-600 mb-1">Current Members:</div>
          {review.participants?.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/80 text-xs"
            >
              <div>
                <div className="font-semibold text-slate-800">{p.fullName || p.username}</div>
                <div className="text-[11px] text-slate-500 uppercase">{p.reviewRole}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  p.isFinished
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {p.isFinished ? 'Finished' : 'In Progress'}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
