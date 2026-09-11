import React, { useState } from 'react';
import { X, Send, MessageSquare, CornerDownRight, Tag } from 'lucide-react';
import { useItemCommentsQuery, useCreateReviewCommentMutation } from '../hooks/useReviewApi';
import { ReviewCommentLabel } from '@aljama/shared';

interface ReviewCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  itemId: string;
  itemKey: string;
  itemName: string;
  selectedText?: string | null;
  onClearSelectedText?: () => void;
}

export const ReviewCommentModal: React.FC<ReviewCommentModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  itemId,
  itemKey,
  itemName,
  selectedText,
  onClearSelectedText,
}) => {
  const [content, setContent] = useState('');
  const [label, setLabel] = useState<ReviewCommentLabel>(ReviewCommentLabel.GENERAL);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: comments = [], isLoading } = useItemCommentsQuery(
    isOpen ? reviewId : undefined,
    isOpen ? itemId : undefined,
  );

  const createCommentMutation = useCreateReviewCommentMutation();

  if (!isOpen) return null;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await createCommentMutation.mutateAsync({
      reviewId,
      itemId,
      dto: {
        content: content.trim(),
        label,
        selectedText: selectedText || undefined,
      },
    });

    setContent('');
    if (onClearSelectedText) onClearSelectedText();
  };

  const handleSendReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    await createCommentMutation.mutateAsync({
      reviewId,
      itemId,
      dto: {
        content: replyContent.trim(),
        parentCommentId,
        label: ReviewCommentLabel.GENERAL,
      },
    });

    setReplyToId(null);
    setReplyContent('');
  };

  const labelColors: Record<ReviewCommentLabel, string> = {
    GENERAL: 'bg-slate-100 text-slate-700 border-slate-200',
    QUESTION: 'bg-blue-100 text-blue-700 border-blue-200',
    ISSUE: 'bg-red-100 text-red-700 border-red-200',
    PROPOSED_CHANGE: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header matching Jama Connect Popover */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-xs text-slate-800 tracking-wide">
              {itemKey} {itemName}:
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected text contextual banner if bôi đen text */}
        {selectedText && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Tag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="font-medium text-amber-800">Text highlighted:</span>
              <span className="bg-yellow-200 px-1.5 py-0.5 rounded font-mono truncate max-w-md">
                "{selectedText}"
              </span>
            </div>
            {onClearSelectedText && (
              <button
                onClick={onClearSelectedText}
                className="text-amber-600 hover:text-amber-800 text-[11px] underline ml-2"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Input box at top matching Screen 4 & 5 */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-2">
          <form onSubmit={handleSubmitComment}>
            <div className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add your comment..."
                className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!content.trim() || createCommentMutation.isPending}
                className="px-4 py-2 bg-[#203a6b] hover:bg-[#1a2f55] text-white text-xs font-medium rounded shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </div>

            {/* Label Selector */}
            <div className="flex items-center gap-2 mt-2 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium">Label:</span>
              {(['GENERAL', 'QUESTION', 'PROPOSED_CHANGE', 'ISSUE'] as ReviewCommentLabel[]).map(
                (l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLabel(l)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      label === l
                        ? `${labelColors[l]} font-semibold ring-1 ring-offset-1`
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {l.replace('_', ' ')}
                  </button>
                ),
              )}
            </div>
          </form>
        </div>

        {/* Comments Thread List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic">
              No comments on this item yet. Start the conversation above.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="pt-3 first:pt-0 space-y-2">
                {/* Main Comment */}
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                    {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-800">
                          {comment.authorName}
                        </span>
                        <span className="text-[11px] text-slate-400">added the comment</span>
                        {comment.label !== 'GENERAL' && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                              labelColors[comment.label]
                            }`}
                          >
                            {comment.label.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Highlighted text if contextual comment */}
                    {comment.selectedText && (
                      <div className="my-1 text-[11px] text-slate-600 bg-yellow-50 border-l-2 border-yellow-400 px-2 py-0.5">
                        <span className="text-slate-400 font-medium mr-1">Text highlighted:</span>
                        <span className="bg-yellow-200 px-1 py-0.2 rounded font-mono">
                          "{comment.selectedText}"
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    {/* Reply Action */}
                    <div className="mt-1.5 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setReplyToId(replyToId === comment.id ? null : comment.id);
                          setReplyContent('');
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        Reply
                      </button>
                    </div>

                    {/* Inline Reply Input */}
                    {replyToId === comment.id && (
                      <div className="mt-2 flex gap-2 pl-4 border-l-2 border-blue-200">
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Reply to ${comment.authorName}...`}
                          autoFocus
                          className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(comment.id)}
                          disabled={!replyContent.trim()}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nested Replies matching Screen 5 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-9 space-y-2 border-l-2 border-slate-100 ml-3.5">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-semibold text-slate-600 flex-shrink-0">
                          {reply.authorName ? reply.authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-slate-800">
                              {reply.authorName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              replied to {comment.authorName}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-auto">
                              {new Date(reply.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
