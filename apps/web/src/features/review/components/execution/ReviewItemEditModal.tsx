import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Send,
  ThumbsUp,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { ReviewItemReadingView, ReviewCommentLabel, ReviewCommentSummary } from '@aljama/shared';
import { formatDistanceToNow } from 'date-fns';
import { TiptapEditor } from '../../../../components/editor/tiptap-editor';
import { useAuthStore } from '../../../../stores/auth.store';
import { ReviewResolveModal } from './ReviewResolveModal';
import {
  useItemCommentsQuery,
  useCreateReviewCommentMutation,
  useResolveCommentMutation,
  useDeleteCommentMutation,
} from '../../hooks/useReviewApi';
import { useUpdateItem } from '../../../item/hooks/use-update-item';

interface ReviewItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  projectId?: string;
  item: ReviewItemReadingView;
  onSaveSuccess?: (savedData?: {
    name: string;
    description: string;
    customFields?: Record<string, unknown>;
  }) => void;
}

export const ReviewItemEditModal: React.FC<ReviewItemEditModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  projectId = '',
  item,
  onSaveSuccess,
}) => {
  const currentUser = useAuthStore(s => s.user);
  const [name, setName] = useState(item.name || '');
  const [description, setDescription] = useState(item.description || '');

  const getAuthor = (c?: any) => {
    return c?.authorName || c?.author?.fullName || c?.author?.username || 'User';
  };
  const getInitials = (c?: any) => {
    const aName = getAuthor(c);
    return aName.slice(0, 2).toUpperCase();
  };
  const [disciplines, setDisciplines] = useState<string[]>(['Mechanical']);
  const [notify, setNotify] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // New comment input
  const [newComment, setNewComment] = useState('');
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Resolve modal state
  const [resolvingComment, setResolvingComment] = useState<ReviewCommentSummary | null>(null);

  // Local state for instant optimistic reaction/resolve
  const [localResolvedNotes, setLocalResolvedNotes] = useState<Record<string, string>>({});
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const [localBookmarks, setLocalBookmarks] = useState<Record<string, boolean>>({});

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Mutations
  const updateItemMutation = useUpdateItem();
  const createCommentMutation = useCreateReviewCommentMutation();
  const resolveCommentMutation = useResolveCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();

  const { data: dbComments = [] } = useItemCommentsQuery(
    isOpen ? reviewId : undefined,
    isOpen ? item.id : undefined,
  );

  useEffect(() => {
    setName(item.name || '');
    setDescription(item.description || '');
    setSaveError(null);
  }, [item]);

  if (!isOpen) return null;

  // Use DB comments with optimistic resolve updates
  const displayComments: ReviewCommentSummary[] = dbComments.map(c => ({
    ...c,
    resolvedNote: localResolvedNotes[c.id] || c.resolvedNote,
    isResolved: !!localResolvedNotes[c.id] || c.isResolved,
  }));

  const handleToggleDiscipline = (disc: string) => {
    setDisciplines(prev => (prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]));
  };

  const handleSave = async (closeAfter: boolean) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      const mergedCustomFields: Record<string, unknown> = {
        ...(item.customFields || {}),
        ...(!item.customFields?.actor ? { actor: 'Clinical Staff' } : {}),
        impactedDisciplines: disciplines,
      };

      await updateItemMutation.mutateAsync({
        itemId: item.itemId || item.id,
        projectId: projectId || '',
        dto: {
          name: name.trim(),
          description: description.trim(),
          customFields: mergedCustomFields,
        },
      });

      if (onSaveSuccess) {
        onSaveSuccess({
          name: name.trim(),
          description: description.trim(),
          customFields: mergedCustomFields,
        });
      }
      if (closeAfter) {
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to save item in review:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu thay đổi cho item. Vui lòng thử lại.';
      setSaveError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmResolve = async (commentId: string, note: string) => {
    setLocalResolvedNotes(prev => ({ ...prev, [commentId]: note }));
    try {
      await resolveCommentMutation.mutateAsync({
        reviewId,
        commentId,
        isResolved: true,
        resolvedNote: note,
      });
    } catch {
      // Optimistic state handled locally
    }
    setResolvingComment(null);
  };

  const handleToggleLike = (commentId: string) => {
    setLocalLikes(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + 1,
    }));
  };

  const handleToggleBookmark = (commentId: string) => {
    setLocalBookmarks(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleAddTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        reviewId,
        itemId: item.id,
        dto: {
          content: newComment.trim(),
          label: ReviewCommentLabel.GENERAL,
        },
      });
    } catch {
      // Optimistic mock
    }
    setNewComment('');
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        reviewId,
        itemId: item.id,
        dto: {
          content: replyText.trim(),
          parentCommentId,
          label: ReviewCommentLabel.GENERAL,
        },
      });
    } catch {
      // Optimistic mock
    }
    setReplyText('');
    setActiveReplyCommentId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className={`bg-white rounded shadow-2xl border border-slate-400 flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-[1340px] h-[92vh]'
        }`}
      >
        {/* Dark modal header matching Jama Connect Screenshot */}
        <div className="h-8 bg-[#323742] text-white px-3 flex items-center justify-between flex-shrink-0 select-none">
          <span className="text-xs font-semibold tracking-wide">Edit item</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:text-white hover:bg-slate-700/60 rounded"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-white hover:bg-red-600/80 rounded"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Main Split: Left Form (~68%) vs Right Comment Stream (~32%) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Item Editor Form */}
          <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-white">
            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Error banner if save fails */}
              {saveError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{saveError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaveError(null)}
                    className="text-red-400 hover:text-red-600 font-bold px-1"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Name field */}
              <div className="flex items-center gap-3">
                <label className="w-20 font-bold text-slate-800 text-right flex-shrink-0">
                  *Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Description field with Rich Text Toolbar */}
              <div className="flex items-start gap-3">
                <label className="w-20 font-medium text-slate-700 text-right pt-2 flex-shrink-0">
                  Description:
                </label>

                <div className="flex-1">
                  <TiptapEditor
                    content={description}
                    onChange={setDescription}
                    placeholder="Enter requirement / item description..."
                    className="min-h-[280px]"
                  />
                </div>
              </div>

              {/* Workflow Status */}
              <div className="flex items-center gap-3 pt-2">
                <label className="w-20 font-medium text-slate-700 text-right flex-shrink-0">
                  Workflow Status:
                </label>
                <span className="font-semibold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Review
                </span>
              </div>

              {/* Impacted Disciplines checkboxes */}
              <div className="flex items-start gap-3">
                <label className="w-20 font-medium text-slate-700 text-right pt-1 flex-shrink-0">
                  Impacted Discipline(s):
                </label>
                <div className="space-y-1.5 pt-1">
                  {['Electrical', 'Firmware', 'Mechanical', 'Software'].map(d => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={disciplines.includes(d)}
                        onChange={() => handleToggleDiscipline(d)}
                        className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="text-slate-700 text-xs">{d}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="h-11 border-t border-slate-200 bg-slate-50 px-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4 text-xs text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={e => setNotify(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Notify</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
                  <span>Compare Mode</span>
                  <input
                    type="checkbox"
                    checked={compareMode}
                    onChange={e => setCompareMode(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isSaving || updateItemMutation.isPending}
                  className="px-4 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || updateItemMutation.isPending}
                  className="px-4 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded shadow-2xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save and Close'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs font-normal disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Comment Stream (Feedback for this item) */}
          <div className="w-[410px] flex flex-col bg-white border-l border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="h-8 border-b border-slate-200 bg-slate-50 px-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Comment Stream</span>
              </div>
            </div>

            {/* Top Add a new comment input */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <form onSubmit={handleAddTopComment} className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                    {(currentUser?.fullName || currentUser?.username || 'U')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a new comment"
                  className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400"
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                )}
              </form>
            </div>

            {/* Stream cards list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {displayComments.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 italic">
                  No comments or feedback on this item yet.
                </div>
              ) : (
                displayComments.map(comment => {
                  const isBookmarked = localBookmarks[comment.id];
                  const likes = localLikes[comment.id] || 0;

                  return (
                    <div key={comment.id} className="space-y-2 border-b border-slate-100 pb-3.5">
                      {/* Top comment card */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Avatar */}
                            <div className="relative">
                              <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-semibold text-[10px] flex items-center justify-center">
                                {getInitials(comment)}
                              </div>
                            </div>

                            <span className="text-xs font-bold text-slate-800">
                              {getAuthor(comment)}
                            </span>

                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {comment.label === ReviewCommentLabel.PROPOSED_CHANGE
                                ? 'Proposed change'
                                : 'Comment'}
                            </span>

                            <span className="text-[11px] text-slate-400">
                              ·{' '}
                              {comment.createdAt
                                ? formatDistanceToNow(new Date(comment.createdAt), {
                                    addSuffix: true,
                                  })
                                : 'just now'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              V{comment.revisionNumber || 1}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleBookmark(comment.id)}
                            className="text-slate-400 hover:text-amber-500 transition-colors"
                            title="Bookmark"
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isBookmarked ? 'fill-amber-400 text-amber-500' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {/* Quoted highlight diff if proposed change */}
                        {comment.selectedText && (
                          <div className="pl-8 text-xs space-y-0.5">
                            <span className="bg-amber-200 text-amber-900 font-semibold px-1 rounded inline-block">
                              {comment.selectedText}
                            </span>
                            <div className="text-slate-700">{comment.content}</div>
                          </div>
                        )}

                        {!comment.selectedText && (
                          <div className="pl-8 text-xs text-slate-800">{comment.content}</div>
                        )}

                        {/* Resolution note banner if resolved */}
                        {comment.isResolved && (
                          <div className="ml-8 mt-1.5 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 text-[11px] text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>
                              <strong>Đã giải quyết:</strong>{' '}
                              {comment.resolvedNote || 'Đã áp dụng thay đổi'}
                            </span>
                          </div>
                        )}

                        {/* Card Action footer */}
                        <div className="pl-8 flex items-center gap-2.5 text-xs text-slate-500 pt-1">
                          <button
                            onClick={() => setResolvingComment(comment)}
                            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                              comment.isResolved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {comment.isResolved ? 'Resolved' : 'Resolve'}
                          </button>

                          <button
                            onClick={() => handleToggleLike(comment.id)}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors text-xs"
                          >
                            <ThumbsUp className="w-3 h-3 text-slate-400" />
                            {likes > 0 && <span>{likes}</span>}
                          </button>

                          <span>·</span>
                          <button
                            onClick={() => {
                              if (confirm('Xóa bình luận này?')) {
                                deleteCommentMutation.mutate({ reviewId, commentId: comment.id });
                              }
                            }}
                            className="hover:text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-8 space-y-2 mt-2">
                          {comment.replies.map(reply => (
                            <div
                              key={reply.id}
                              className="bg-slate-50 p-2 rounded border border-slate-100 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-slate-600 text-white font-semibold text-[9px] flex items-center justify-center">
                                    {getInitials(reply)}
                                  </div>
                                  <span className="font-bold text-slate-800 text-xs">
                                    {getAuthor(reply)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ·{' '}
                                    {reply.createdAt
                                      ? formatDistanceToNow(new Date(reply.createdAt), {
                                          addSuffix: true,
                                        })
                                      : 'just now'}{' '}
                                    V{reply.revisionNumber || 1}
                                  </span>
                                </div>
                                <Bookmark className="w-3 h-3 text-slate-300" />
                              </div>
                              <p className="text-slate-700 pl-6">{reply.content}</p>
                              <div className="pl-6 flex items-center gap-2 text-[11px] text-slate-400">
                                <ThumbsUp className="w-2.5 h-2.5" />
                                <span>·</span>
                                <button
                                  onClick={() =>
                                    deleteCommentMutation.mutate({ reviewId, commentId: reply.id })
                                  }
                                  className="hover:text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline reply field */}
                      <div className="pl-8 pt-1 flex items-center gap-2">
                        <div className="relative flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                            {(currentUser?.fullName || currentUser?.username || 'U')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={activeReplyCommentId === comment.id ? replyText : ''}
                          onFocus={() => setActiveReplyCommentId(comment.id)}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddReply(comment.id);
                          }}
                          placeholder="Add your reply"
                          className="flex-1 text-xs px-2.5 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400"
                        />
                        {activeReplyCommentId === comment.id && replyText.trim() && (
                          <button
                            type="button"
                            onClick={() => handleAddReply(comment.id)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resolve Note Modal */}
      {resolvingComment && (
        <ReviewResolveModal
          isOpen={!!resolvingComment}
          onClose={() => setResolvingComment(null)}
          commentId={resolvingComment.id}
          commentAuthor={getAuthor(resolvingComment)}
          commentLabel={resolvingComment.label}
          commentContent={resolvingComment.content}
          selectedText={resolvingComment.selectedText}
          onConfirm={handleConfirmResolve}
          isSubmitting={resolveCommentMutation.isPending}
        />
      )}
    </div>
  );
};
