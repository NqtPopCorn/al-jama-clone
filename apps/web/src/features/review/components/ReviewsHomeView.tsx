import React, { useState } from 'react';
import {
  Plus,
  Filter,
  Grid,
  List,
  Edit2,
  RefreshCw,
  BarChart2,
  Trash2,
  Clock,
  CheckCircle2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useReviewsList } from '../hooks/useReviewApi';
import { StartReviewWizard } from './StartReviewWizard';
import { ReviewSummary } from '@aljama/shared';

interface ReviewsHomeViewProps {
  onSelectReview: (reviewId: string) => void;
  projectId?: string;
  projectName?: string;
  projectMembers?: Array<{ userId: string; fullName: string; username: string }>;
}

export const ReviewsHomeView: React.FC<ReviewsHomeViewProps> = ({
  onSelectReview,
  projectId = '',
  projectName = 'Current Project',
  projectMembers = [],
}) => {
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data, isLoading, refetch } = useReviewsList({
    scope,
    status: statusFilter || undefined,
    search: search.trim() || undefined,
    page,
    limit: 20,
  });

  const reviews = data?.items || [];
  const myCount = data?.myCount ?? 0;
  const allCount = data?.allCount ?? 0;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
            In Progress
          </span>
        );
      case 'FINALIZED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            Completed
          </span>
        );
      case 'CLOSED_FOR_FEEDBACK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
            Closed
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Top Bar: Tabs (My Reviews vs All Reviews) & Actions matching Screen 1 */}
      <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white flex-shrink-0">
        {/* Left Tabs */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => {
              setScope('my');
              setPage(1);
            }}
            className={`pb-4 pt-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              scope === 'my'
                ? 'border-[#203a6b] text-[#203a6b] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>My Reviews</span>
            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600 font-semibold">
              {myCount}
            </span>
          </button>

          <button
            onClick={() => {
              setScope('all');
              setPage(1);
            }}
            className={`pb-4 pt-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              scope === 'all'
                ? 'border-[#203a6b] text-[#203a6b] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Reviews</span>
            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600 font-semibold">
              {allCount}
            </span>
          </button>
        </div>

        {/* Right Controls: Filter, View Mode, + Start a review */}
        <div className="flex items-center gap-3">
          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">FILTER BY...</option>
              <option value="ACTIVE">In Progress</option>
              <option value="FINALIZED">Completed</option>
              <option value="CLOSED_FOR_FEEDBACK">Closed</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-300 rounded overflow-hidden text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${
                viewMode === 'grid' ? 'bg-slate-100 text-blue-800' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${
                viewMode === 'table' ? 'bg-slate-100 text-blue-800' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Start a Review Button */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-3.5 py-1.5 bg-[#203a6b] hover:bg-[#1a2f55] text-white text-xs font-semibold rounded shadow flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Start a review</span>
          </button>
        </div>
      </div>

      {/* Content Table / Grid matching Screen 1 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-xs text-slate-400">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Loading reviews...</span>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-24 text-slate-400 space-y-3">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 text-sm">No reviews found</h3>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              Get started by creating a collaborative peer review or formal approval review.
            </p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 bg-[#203a6b] text-white text-xs font-semibold rounded shadow transition-colors"
            >
              Start a review
            </button>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
              <tr>
                <th className="w-8 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">ID</th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Project</th>
                <th className="px-3 py-2.5">Public</th>
                <th className="px-3 py-2.5">Review status</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Revision</th>
                <th className="px-3 py-2.5">Moderator(s)</th>
                <th className="px-3 py-2.5">End date</th>
                <th className="w-24 px-3 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelectReview(r.id)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className="px-3 py-2.5 text-center">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-blue-600 group-hover:underline">
                    {r.key}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{r.name}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.projectName}</td>
                  <td className="px-3 py-2.5 text-slate-400">{r.isPublic ? 'Yes' : ''}</td>
                  <td className="px-3 py-2.5">{getStatusBadge(r.status)}</td>
                  <td className="px-3 py-2.5 text-slate-700 font-medium">{r.role || 'Participant'}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.revisionNumber}</td>
                  <td className="px-3 py-2.5 text-slate-700">{r.moderatorNames.join(', ')}</td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">
                    {r.deadline ? new Date(r.deadline).toLocaleDateString() : '—'}
                  </td>
                  <td
                    className="px-3 py-2.5 text-center text-slate-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <button title="Edit review" className="hover:text-slate-800">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button title="View stats" className="hover:text-slate-800">
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer matching Screen 1 */}
      <div className="h-10 border-t border-slate-200 px-6 flex items-center justify-between bg-slate-50 text-xs text-slate-500 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="mx-2">•</span>
          <span>Show: 20</span>
        </div>

        <div>
          Displaying {reviews.length > 0 ? (page - 1) * 20 + 1 : 0} -{' '}
          {Math.min(page * 20, total)} of {total}
        </div>
      </div>

      {/* Start Review Wizard Modal */}
      {isWizardOpen && (
        <StartReviewWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          projectId={projectId}
          projectName={projectName}
          members={projectMembers}
          onSuccess={(newReviewId) => {
            refetch();
            onSelectReview(newReviewId);
          }}
        />
      )}
    </div>
  );
};
