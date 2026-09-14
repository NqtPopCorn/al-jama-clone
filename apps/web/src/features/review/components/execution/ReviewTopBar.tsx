import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Calendar,
  RotateCw,
  Bell,
  Trash2,
  Download,
  Users,
} from 'lucide-react';
import { ReviewDetail, ReviewRole } from '@aljama/shared';

interface ReviewTopBarProps {
  review: ReviewDetail;
  onBack: () => void;
  activeRole: ReviewRole;
  isModeratorMode: boolean;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  onPublishRevision: () => void;
  onCloseForFeedback: () => void;
  onReopenReview: () => void;
  onFinalizeReview: () => void;
  onOpenParticipantsModal: () => void;
  onCompleteReview: () => void;
  onDeleteReview?: () => void;
  isActionPending?: boolean;
}

export const ReviewTopBar: React.FC<ReviewTopBarProps> = ({
  review,
  onBack,
  activeRole,
  isModeratorMode,
  isApproverMode,
  isReviewerMode,
  onPublishRevision,
  onCloseForFeedback,
  onReopenReview,
  onFinalizeReview,
  onOpenParticipantsModal,
  onCompleteReview,
  onDeleteReview,
  isActionPending = false,
}) => {
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-2.5 flex-shrink-0 flex items-center justify-between shadow-2xs">
      {/* Left: Breadcrumbs & Review Info */}
      <div className="space-y-0.5">
        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
          <button
            onClick={onBack}
            className="hover:text-blue-600 hover:underline flex items-center gap-1 text-slate-500 font-medium transition-colors"
            title="Trở về Reviews"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Review Center</span>
          </button>
          <span>/</span>
          <span>{review.projectName || 'Project'}</span>
          <span>/</span>
          <span className="font-mono text-slate-700 font-semibold">{review.key}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900 leading-tight">{review.name}</h1>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
            V{review.currentRevisionNumber}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="capitalize">{review.template?.name || 'Approval review'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {review.deadline ? new Date(review.deadline).toLocaleDateString() : 'No deadline'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
            <span className="capitalize">{review.status.toLowerCase().replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      {/* Right: Utility Link (Subscribe) & Action Buttons */}
      <div className="flex flex-col items-end gap-2">
        {/* Top utility links: user requested removal of Add moderators, Add participants, Delegate approval */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
          <button
            onClick={() => setIsSubscribed(!isSubscribed)}
            className={`flex items-center gap-1 transition-colors ${
              isSubscribed ? 'text-blue-600 font-semibold' : 'hover:text-blue-600'
            }`}
            title="Subscribe to review notifications"
          >
            <Bell
              className={`w-3 h-3 ${isSubscribed ? 'fill-blue-600 text-blue-600' : 'text-slate-400'}`}
            />
            <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
          </button>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-2.5">
          {/* 1. Approver & Reviewer: Complete review button */}
          {(isApproverMode || isReviewerMode) && (
            <button
              onClick={onCompleteReview}
              disabled={isActionPending}
              className="px-3.5 py-1.5 bg-[#0070ba] hover:bg-[#005a96] active:bg-[#004a7c] disabled:opacity-50 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Complete review</span>
            </button>
          )}

          {/* 2. Moderator Action Buttons matching Image 2 */}
          {isModeratorMode && (
            <>
              {/* Publish new revision */}
              <button
                onClick={onPublishRevision}
                disabled={isActionPending}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>✎ Publish new revision</span>
              </button>

              {/* Manage review Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowManageMenu(!showManageMenu)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span className="font-mono">:=</span>
                  <span>Manage review</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {showManageMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1 text-xs"
                    onMouseLeave={() => setShowManageMenu(false)}
                  >
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        onCloseForFeedback();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Close for feedback</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        onFinalizeReview();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Finalize review</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        onReopenReview();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reopen review</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        onOpenParticipantsModal();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Manage participants</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Export dropdown (Available across all roles) */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded shadow-lg z-50 py-1 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    window.print();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Export PDF / Print
                </button>
                <button
                  onClick={() => {
                    const json = JSON.stringify(review, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${review.key}-export.json`;
                    a.click();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>

          {/* Delete / Trash (Moderator only) */}
          {isModeratorMode && onDeleteReview && (
            <button
              onClick={onDeleteReview}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
