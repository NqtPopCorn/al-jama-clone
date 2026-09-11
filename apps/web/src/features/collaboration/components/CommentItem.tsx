import React from 'react';
import { CommentData } from '../hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import { Reply, CornerDownRight } from 'lucide-react';

interface CommentItemProps {
  comment: CommentData;
  onReply?: (comment: CommentData) => void;
  onNavigateToItem?: (itemId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onNavigateToItem }) => {
  // Render content with styled @mentions
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/((?:^|\s)@[a-zA-Z0-9._-]+)/g);
    return parts.map((part, index) => {
      if (part.trim().startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-flex items-center font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1 py-0.5 rounded text-[12px]"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="group flex gap-3 text-sm p-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#203a6b] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.fullName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          comment.author.fullName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header line: Author, Item tag (if any), Timestamp, Reply action */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs">
              {comment.author.fullName}
            </span>

            {comment.item && (
              <span
                onClick={() => onNavigateToItem?.(comment.item!.id)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 font-medium ${
                  onNavigateToItem ? 'cursor-pointer hover:underline' : ''
                }`}
                title={comment.item.name}
              >
                {comment.item.itemKey}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>

            {onReply && (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity flex items-center gap-1 text-[11px] font-medium"
                title="Reply to comment"
              >
                <Reply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}
          </div>
        </div>

        {/* Parent reply preview (BR-COLLAB-05) */}
        {comment.parent && (
          <div className="mb-1.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded border-l-2 border-blue-500">
            <CornerDownRight className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Replying to @{comment.parent.author.fullName}:
            </span>
            <span className="truncate italic">"{comment.parent.content}"</span>
          </div>
        )}

        {/* Comment Text */}
        <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words text-[13px] leading-relaxed">
          {renderFormattedContent(comment.content)}
        </div>
      </div>
    </div>
  );
};
