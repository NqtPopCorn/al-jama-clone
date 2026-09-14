import React, { useState, useMemo } from 'react';
import {
  Search,
  Bookmark,
  ThumbsUp,
  RotateCcw,
  CheckCircle2,
  Edit2,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  ReviewDetail,
  ReviewCommentSummary,
  ReviewCommentLabel,
  ReviewItemReadingView,
} from '@aljama/shared';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../../../stores/auth.store';
import {
  useAllReviewCommentsQuery,
  useCreateReviewCommentMutation,
  useResolveCommentMutation,
  useDeleteCommentMutation,
} from '../../hooks/useReviewApi';
import { ReviewResolveModal } from './ReviewResolveModal';
import { ReviewItemEditModal } from './ReviewItemEditModal';

interface ReviewFeedbackStreamViewProps {
  review: ReviewDetail;
  items: ReviewItemReadingView[];
  isModeratorMode?: boolean;
  onOpenSingleItemView?: (itemIndex: number) => void;
}

type FeedbackFilterCategory =
  'ALL' | 'OPEN' | 'MINE' | 'REVIEW' | 'IMPORTANT' | 'QUESTIONS' | 'PROPOSED_CHANGES' | 'ISSUES';

export const ReviewFeedbackStreamView: React.FC<ReviewFeedbackStreamViewProps> = ({
  review,
  items,
  isModeratorMode = false,
  onOpenSingleItemView,
}) => {
  const currentUser = useAuthStore(s => s.user);
  const currentUserInitials = (currentUser?.fullName || currentUser?.username || 'U')
    .slice(0, 2)
    .toUpperCase();
  const [activeCategory, setActiveCategory] = useState<FeedbackFilterCategory>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTopComment, setNewTopComment] = useState('');

  const getAuthor = (c?: any) => {
    return c?.authorName || c?.author?.fullName || c?.author?.username || 'Participant';
  };
  const getInitials = (c?: any) => {
    const aName = getAuthor(c);
    return aName.slice(0, 2).toUpperCase();
  };

  // Selected item to edit via ReviewItemEditModal
  const [editingItem, setEditingItem] = useState<ReviewItemReadingView | null>(null);

  // Resolving modal
  const [resolvingComment, setResolvingComment] = useState<ReviewCommentSummary | null>(null);

  // Local optimistic states
  const [localResolvedNotes, setLocalResolvedNotes] = useState<Record<string, string>>({});
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const [localBookmarks, setLocalBookmarks] = useState<Record<string, boolean>>({});

  // Active reply fields: commentId -> text
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // API hooks
  const { data: apiComments = [] } = useAllReviewCommentsQuery(
    review.id,
    review.currentRevisionNumber,
  );
  const createCommentMutation = useCreateReviewCommentMutation();
  const resolveCommentMutation = useResolveCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();

  const primaryItem = items[0] || null;

  // Combined comments
  const allComments: ReviewCommentSummary[] = useMemo(() => {
    return apiComments.map(c => ({
      ...c,
      isResolved:
        localResolvedNotes[c.id] !== undefined ? !!localResolvedNotes[c.id] : c.isResolved,
      resolvedNote:
        localResolvedNotes[c.id] !== undefined ? localResolvedNotes[c.id] : c.resolvedNote,
    }));
  }, [apiComments, localResolvedNotes]);

  // Compute Category Counts
  const counts = useMemo(() => {
    let all = 0;
    let open = 0;
    let mine = 0;
    let reviewCount = 0;
    let important = 0;
    let questions = 0;
    let proposed = 0;
    let issues = 0;

    const currentUserId = currentUser?.id;

    allComments.forEach(c => {
      all += 1;
      if (!c.isResolved) open += 1;
      if (currentUserId && c.authorId === currentUserId) mine += 1;
      if (!c.itemKey || c.id.startsWith('c-rev')) reviewCount += 1;
      if (localBookmarks[c.id]) important += 1;
      if (c.label === ReviewCommentLabel.QUESTION) questions += 1;
      if (c.label === ReviewCommentLabel.PROPOSED_CHANGE) proposed += 1;
      if (c.label === ReviewCommentLabel.ISSUE) issues += 1;
    });

    return {
      all,
      open,
      mine,
      review: reviewCount,
      important,
      questions,
      proposed,
      issues,
    };
  }, [allComments, localBookmarks, currentUser?.id]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    return allComments.filter(c => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          c.content.toLowerCase().includes(q) ||
          getAuthor(c).toLowerCase().includes(q) ||
          (c.itemKey && c.itemKey.toLowerCase().includes(q)) ||
          (c.itemName && c.itemName.toLowerCase().includes(q)) ||
          (c.selectedText && c.selectedText.toLowerCase().includes(q));
        if (!matchText) return false;
      }

      // Category filter
      switch (activeCategory) {
        case 'ALL':
          return true;
        case 'OPEN':
          return !c.isResolved;
        case 'MINE':
          return !!currentUser?.id && c.authorId === currentUser.id;
        case 'REVIEW':
          return !c.itemKey || c.id.startsWith('c-rev');
        case 'IMPORTANT':
          return !!localBookmarks[c.id];
        case 'QUESTIONS':
          return c.label === ReviewCommentLabel.QUESTION;
        case 'PROPOSED_CHANGES':
          return c.label === ReviewCommentLabel.PROPOSED_CHANGE;
        case 'ISSUES':
          return c.label === ReviewCommentLabel.ISSUE;
        default:
          return true;
      }
    });
  }, [allComments, activeCategory, searchQuery, localBookmarks, currentUser?.id]);

  // Group filtered comments by "This review:" vs "<ItemKey> <ItemName>:"
  const reviewLevelComments = filteredComments.filter(c => !c.itemKey || c.id.startsWith('c-rev'));
  const itemLevelComments = filteredComments.filter(c => c.itemKey && !c.id.startsWith('c-rev'));

  // Group item comments by itemKey
  const groupedItemComments = useMemo(() => {
    const groups: Record<
      string,
      { itemKey: string; itemName: string; comments: ReviewCommentSummary[] }
    > = {};
    itemLevelComments.forEach(c => {
      const key = c.itemKey || primaryItem.itemKey || 'Item';
      if (!groups[key]) {
        groups[key] = {
          itemKey: key,
          itemName: c.itemName || primaryItem.name || '',
          comments: [],
        };
      }
      groups[key].comments.push(c);
    });
    return Object.values(groups);
  }, [itemLevelComments, primaryItem]);

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

  const handleConfirmResolve = async (commentId: string, note: string) => {
    setLocalResolvedNotes(prev => ({ ...prev, [commentId]: note }));
    try {
      await resolveCommentMutation.mutateAsync({
        reviewId: review.id,
        commentId,
        isResolved: true,
        resolvedNote: note,
      });
    } catch {
      // Optimistic locally handled
    }
    setResolvingComment(null);
  };

  const handleAddTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopComment.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        reviewId: review.id,
        itemId: primaryItem?.id || '',
        dto: {
          content: newTopComment.trim(),
          label: ReviewCommentLabel.GENERAL,
        },
      });
    } catch {
      // Optimistic
    }
    setNewTopComment('');
  };

  const handleSendReply = async (commentId: string, itemId: string) => {
    const text = replyDrafts[commentId]?.trim();
    if (!text) return;

    try {
      await createCommentMutation.mutateAsync({
        reviewId: review.id,
        itemId,
        dto: {
          content: text,
          parentCommentId: commentId,
          label: ReviewCommentLabel.GENERAL,
        },
      });
    } catch {
      // Optimistic
    }
    setReplyDrafts(prev => ({ ...prev, [commentId]: '' }));
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* 1. LEFT SIDEBAR: Timer, Search & Filter Categories */}
      <div className="w-52 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 select-none">
        {/* Top Progress & Timer row matching screenshot */}
        <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full border border-slate-400" />
            0:04
          </span>
          {/* 100% green bar */}
          <div className="flex-1 h-3 bg-emerald-500 rounded flex items-center justify-center text-[9px] font-bold text-white shadow-2xs">
            100%
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-0.5 rounded" title="Rewind">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Search box */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 rounded-md bg-slate-50/70 focus:bg-white focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Filter categories list */}
        <div className="flex-1 overflow-y-auto py-1 text-xs">
          {[
            { key: 'ALL', label: 'All', count: counts.all },
            { key: 'OPEN', label: 'Open', count: counts.open },
            { key: 'MINE', label: 'Mine', count: counts.mine },
            { key: 'REVIEW', label: 'Review', count: counts.review },
            { key: 'IMPORTANT', label: 'Important', count: counts.important },
            { key: 'QUESTIONS', label: 'Questions', count: counts.questions },
            { key: 'PROPOSED_CHANGES', label: 'Proposed changes', count: counts.proposed },
            { key: 'ISSUES', label: 'Issues', count: counts.issues },
          ].map(cat => {
            const isSelected = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key as FeedbackFilterCategory)}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-slate-100 font-bold text-slate-900 border-l-3 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-slate-400 text-[11px]">({cat.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. RIGHT CONTENT: Feedback Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white max-w-5xl">
        {/* Top comment box with current user avatar */}
        <div className="border-b border-slate-200 pb-5">
          <form onSubmit={handleAddTopComment} className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                {currentUserInitials}
              </div>
              {(isModeratorMode || !!review.isModerator) && (
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white"
                  title="Moderator"
                >
                  M
                </span>
              )}
            </div>
            <input
              type="text"
              value={newTopComment}
              onChange={e => setNewTopComment(e.target.value)}
              placeholder="Add a new comment"
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-400 shadow-2xs"
            />
            {newTopComment.trim() && (
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 shadow-2xs flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Comment</span>
              </button>
            )}
          </form>
        </div>

        {/* SECTION 1: This review: */}
        {reviewLevelComments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">This review:</h3>

            {reviewLevelComments.map(comment => {
              const isBookmarked = localBookmarks[comment.id];
              const likes = localLikes[comment.id] || 0;

              return (
                <div
                  key={comment.id}
                  className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-7 h-7 rounded-full bg-slate-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {getInitials(comment)}
                      </div>
                      <span className="font-bold text-slate-900">{getAuthor(comment)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Comment
                      </span>
                      <span className="text-slate-400">
                        ·{' '}
                        {comment.createdAt
                          ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                          : 'vừa xong'}
                      </span>
                      <span className="text-slate-400">
                        V{comment.revisionNumber || review.currentRevisionNumber || 1}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(comment.id)}
                      className="text-slate-400 hover:text-amber-500"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          isBookmarked ? 'fill-amber-400 text-amber-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="text-xs text-slate-800 pl-9 font-medium">{comment.content}</div>

                  {/* Resolution banner if resolved */}
                  {comment.isResolved && (
                    <div className="ml-9 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        <strong>Đã xử lý:</strong> {comment.resolvedNote || 'Đã áp dụng thay đổi'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pl-9 flex items-center gap-3 text-xs text-slate-500">
                    <button
                      onClick={() => setResolvingComment(comment)}
                      className={`px-2.5 py-0.5 rounded border text-xs transition-colors ${
                        comment.isResolved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {comment.isResolved ? 'Resolved' : 'Resolve'}
                    </button>

                    <button
                      onClick={() => handleToggleLike(comment.id)}
                      className="flex items-center gap-1 hover:text-blue-600 text-xs"
                    >
                      <ThumbsUp className="w-3 h-3 text-slate-400" />
                      {likes > 0 && <span>{likes}</span>}
                    </button>

                    <span>·</span>
                    <button
                      onClick={() => {
                        if (confirm('Xóa bình luận này?')) {
                          deleteCommentMutation.mutate({
                            reviewId: review.id,
                            commentId: comment.id,
                          });
                        }
                      }}
                      className="hover:text-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Inline Reply input */}
                  <div className="pl-9 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                        {currentUserInitials}
                      </div>
                      {(isModeratorMode || !!review.isModerator) && (
                        <span
                          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] font-extrabold flex items-center justify-center border border-white"
                          title="Moderator"
                        >
                          M
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={replyDrafts[comment.id] || ''}
                      onChange={e =>
                        setReplyDrafts({ ...replyDrafts, [comment.id]: e.target.value })
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendReply(comment.id, comment.reviewItemId);
                      }}
                      placeholder="Add your reply"
                      className="flex-1 text-xs px-2.5 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400"
                    />
                    {replyDrafts[comment.id]?.trim() && (
                      <button
                        type="button"
                        onClick={() => handleSendReply(comment.id, comment.reviewItemId)}
                        className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredComments.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            Chưa có phản hồi nào trong mục này.
          </div>
        )}

        {/* SECTION 2: Item-grouped feedback (e.g. Rev-SR-2 Surgical Installation:) */}
        {groupedItemComments.map(group => {
          const matchedItem = items.find(it => it.itemKey === group.itemKey) || primaryItem;

          return (
            <div key={group.itemKey} className="space-y-3 pt-2">
              {/* Item Heading with "Edit item" button */}
              <div className="flex items-center justify-between">
                <h3
                  onClick={() => {
                    const idx = items.findIndex(it => it.itemKey === group.itemKey);
                    if (idx >= 0 && onOpenSingleItemView) onOpenSingleItemView(idx);
                  }}
                  className="text-sm font-bold text-slate-800 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                >
                  <span>
                    {group.itemKey} {group.itemName}:
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </h3>

                <button
                  onClick={() => setEditingItem(matchedItem)}
                  className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200 flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Sửa nội dung item</span>
                </button>
              </div>

              {/* Cards under this item */}
              {group.comments.map(comment => {
                const isBookmarked = localBookmarks[comment.id];
                const likes = localLikes[comment.id] || 0;

                return (
                  <div
                    key={comment.id}
                    className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                            {getInitials(comment)}
                          </div>
                        </div>

                        <span className="font-bold text-slate-900">{getAuthor(comment)}</span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {comment.label === ReviewCommentLabel.PROPOSED_CHANGE
                            ? 'Proposed change'
                            : 'Comment'}
                        </span>

                        <span className="text-slate-400">
                          ·{' '}
                          {comment.createdAt
                            ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                            : 'vừa xong'}
                        </span>
                        <span className="text-slate-400">
                          V{comment.revisionNumber || review.currentRevisionNumber || 1}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleBookmark(comment.id)}
                        className="text-slate-400 hover:text-amber-500"
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isBookmarked ? 'fill-amber-400 text-amber-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Highlight diff quote if proposed change */}
                    {comment.selectedText && (
                      <div className="pl-9 space-y-1 text-xs">
                        <span className="bg-amber-200 text-amber-900 font-semibold px-1 rounded inline-block">
                          {comment.selectedText}
                        </span>
                        <div className="text-slate-700">{comment.content}</div>
                      </div>
                    )}

                    {!comment.selectedText && (
                      <div className="pl-9 text-xs text-slate-800">{comment.content}</div>
                    )}

                    {/* Resolution banner if resolved */}
                    {comment.isResolved && (
                      <div className="ml-9 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>
                          <strong>Đã xử lý:</strong> {comment.resolvedNote || 'Đã áp dụng thay đổi'}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pl-9 flex items-center gap-3 text-xs text-slate-500">
                      <button
                        onClick={() => setResolvingComment(comment)}
                        className={`px-2.5 py-0.5 rounded border text-xs transition-colors ${
                          comment.isResolved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {comment.isResolved ? 'Resolved' : 'Resolve'}
                      </button>

                      <button
                        onClick={() => handleToggleLike(comment.id)}
                        className="flex items-center gap-1 hover:text-blue-600 text-xs"
                      >
                        <ThumbsUp className="w-3 h-3 text-slate-400" />
                        {likes > 0 && <span>{likes}</span>}
                      </button>

                      <span>·</span>
                      <button
                        onClick={() => setEditingItem(matchedItem)}
                        className="hover:text-blue-600 text-xs"
                      >
                        Edit item
                      </button>

                      <span>·</span>
                      <button
                        onClick={() => {
                          if (confirm('Xóa bình luận này?')) {
                            deleteCommentMutation.mutate({
                              reviewId: review.id,
                              commentId: comment.id,
                            });
                          }
                        }}
                        className="hover:text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="pl-9 space-y-2 pt-1">
                        {comment.replies.map(reply => (
                          <div
                            key={reply.id}
                            className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-600 text-white font-semibold text-[9px] flex items-center justify-center">
                                  {getInitials(reply)}
                                </div>
                                <span className="font-bold text-slate-800">{getAuthor(reply)}</span>
                                <span className="text-slate-400 text-[11px]">
                                  ·{' '}
                                  {reply.createdAt
                                    ? formatDistanceToNow(new Date(reply.createdAt), {
                                        addSuffix: true,
                                      })
                                    : 'vừa xong'}{' '}
                                  V{reply.revisionNumber || review.currentRevisionNumber || 1}
                                </span>
                              </div>
                              <Bookmark className="w-3 h-3 text-slate-300" />
                            </div>
                            <p className="text-slate-700 pl-7">{reply.content}</p>
                            <div className="pl-7 flex items-center gap-2 text-[11px] text-slate-400">
                              <ThumbsUp className="w-2.5 h-2.5" />
                              <span>·</span>
                              <button
                                onClick={() =>
                                  deleteCommentMutation.mutate({
                                    reviewId: review.id,
                                    commentId: reply.id,
                                  })
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

                    {/* Inline Reply input */}
                    <div className="pl-9 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">
                          {currentUserInitials}
                        </div>
                        {(isModeratorMode || !!review.isModerator) && (
                          <span
                            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] font-extrabold flex items-center justify-center border border-white"
                            title="Moderator"
                          >
                            M
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={replyDrafts[comment.id] || ''}
                        onChange={e =>
                          setReplyDrafts({ ...replyDrafts, [comment.id]: e.target.value })
                        }
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSendReply(comment.id, comment.reviewItemId);
                        }}
                        placeholder="Add your reply"
                        className="flex-1 text-xs px-2.5 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400"
                      />
                      {replyDrafts[comment.id]?.trim() && (
                        <button
                          type="button"
                          onClick={() => handleSendReply(comment.id, comment.reviewItemId)}
                          className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
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

      {/* Edit Item Modal */}
      {editingItem && (
        <ReviewItemEditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          reviewId={review.id}
          projectId={review.projectId}
          item={editingItem}
        />
      )}
    </div>
  );
};
