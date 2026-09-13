import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Check,
  RotateCw,
  Users,
  Bell,
  Trash2,
  Download,
  Share2,
  UserPlus,
} from 'lucide-react';
import { ReviewDetail, ReviewRole } from '@aljama/shared';

interface ReviewTopBarProps {
  review: ReviewDetail;
  onBack: () => void;
  activeRole: ReviewRole;
  userAvailableRoles: ReviewRole[];
  onRoleChange: (role: ReviewRole) => void;
  isModeratorMode: boolean;
  isApproverMode: boolean;
  isReviewerMode: boolean;
  onPublishRevision: () => void;
  onCloseForFeedback: () => void;
  onReopenReview: () => void;
  onFinalizeReview: () => void;
  onOpenParticipantsModal: () => void;
  onCompleteReview: () => void;
  onMarkPageAsReviewed: () => void;
  onDeleteReview?: () => void;
  isActionPending?: boolean;
}

export const ReviewTopBar: React.FC<ReviewTopBarProps> = ({
  review,
  onBack,
  activeRole,
  userAvailableRoles,
  onRoleChange,
  isModeratorMode,
  isApproverMode,
  isReviewerMode,
  onPublishRevision,
  onCloseForFeedback,
  onReopenReview,
  onFinalizeReview,
  onOpenParticipantsModal,
  onCompleteReview,
  onMarkPageAsReviewed,
  onDeleteReview,
  isActionPending = false,
}) => {
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
          <span>Medical Device Control System</span>
          <span>/</span>
          <span className="font-mono text-slate-700 font-semibold">{review.key}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            {review.name}
          </h1>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
            V{review.currentRevisionNumber}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="capitalize">{review.template?.name || 'Peer review'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {review.deadline
              ? new Date(review.deadline).toLocaleDateString()
              : 'No deadline'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
            <span className="capitalize">{review.status.toLowerCase().replace('_', ' ')}</span>
          </span>
        </div>
      </div>

      {/* Right: Actions, Role Switcher, & Top buttons */}
      <div className="flex flex-col items-end gap-2">
        {/* Top utility links */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
          <button
            onClick={onOpenParticipantsModal}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <UserPlus className="w-3 h-3 text-slate-400" />
            Add moderators
          </button>
          <button
            onClick={onOpenParticipantsModal}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Users className="w-3 h-3 text-slate-400" />
            Add participants
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <Share2 className="w-3 h-3 text-slate-400" />
            Delegate approval
          </button>
          <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <Bell className="w-3 h-3 text-slate-400" />
            Subscribe
          </button>
        </div>

        {/* Action Button Row with Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Role Switcher Pill */}
          {userAvailableRoles.length > 0 && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-300 text-xs">
              {userAvailableRoles.map(role => {
                const isActive = activeRole === role;
                const label =
                  role === 'MODERATOR'
                    ? 'Moderator'
                    : role === 'APPROVER'
                    ? 'Approver'
                    : 'Reviewer';
                return (
                  <button
                    key={role}
                    onClick={() => onRoleChange(role)}
                    className={`px-3 py-1 rounded font-medium transition-all ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Role-Specific Action Buttons */}
          {/* 1. Reviewer Buttons */}
          {isReviewerMode && (
            <button
              onClick={onMarkPageAsReviewed}
              disabled={isActionPending}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded border border-emerald-300 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark page as reviewed</span>
            </button>
          )}

          {/* 2. Approver Button: Complete review */}
          {isApproverMode && (
            <button
              onClick={onCompleteReview}
              disabled={isActionPending}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete review</span>
            </button>
          )}

          {/* 3. Moderator Buttons matching screenshot [17:06] */}
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
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span>:= Manage review</span>
                  <ChevronDown className="w-3 h-3" />
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

              {/* Export dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded flex items-center gap-1 shadow-2xs"
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

              {/* Delete / Trash */}
              {onDeleteReview && (
                <button
                  onClick={onDeleteReview}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
