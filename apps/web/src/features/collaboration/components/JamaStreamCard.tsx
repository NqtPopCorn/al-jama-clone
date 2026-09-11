import React, { useState } from 'react';
import { CommentData } from '../hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import { Mail, ChevronDown, ChevronUp, CornerDownRight, User as UserIcon } from 'lucide-react';
import { JamaStreamComposer } from './JamaStreamComposer';
import { ProjectMemberSummary } from '@aljama/shared';

interface JamaStreamCardProps {
  comment: CommentData;
  replies?: CommentData[];
  members?: ProjectMemberSummary[];
  onReplySubmit: (
    parentCommentId: string,
    content: string,
    mentionUserIds?: string[],
  ) => Promise<void>;
  onNavigateToItem?: (itemId: string) => void;
}

export const JamaStreamCard: React.FC<JamaStreamCardProps> = ({
  comment,
  replies = [],
  members = [],
  onReplySubmit,
  onNavigateToItem,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [showItemDescription, setShowItemDescription] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Format content with @mention and #hashtag highlighting
  const renderFormattedContent = (text: string) => {
    // Split by @mention or #hashtag
    const parts = text.split(/((?:^|\s)@[a-zA-Z0-9._-]+|(?:^|\s)#[a-zA-Z0-9_-]+)/g);

    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-flex items-center gap-0.5 font-bold text-slate-900 dark:text-slate-100 bg-sky-50 dark:bg-sky-950/50 px-1 py-0.2 rounded text-[12px]"
          >
            <UserIcon className="w-2.5 h-2.5 text-[#0088cc] shrink-0" />
            <span>{trimmed.slice(1)}</span>
          </span>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <span
            key={index}
            className="font-bold text-[#0088cc] dark:text-sky-400 cursor-pointer hover:underline text-[12px]"
          >
            {trimmed}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-sm p-3.5 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors">
      {/* Main Comment Header & Body */}
      <div className="flex items-start gap-3">
        {/* Left Avatar (Square with subtle rounded corner, matching Image 1 & 2) */}
        <div className="w-11 h-11 rounded bg-[#203a6b] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs overflow-hidden border border-slate-200 dark:border-slate-700">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            comment.author.fullName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          {/* Optional Item Header line (Matching Image 2: "MK-UC-48 Schedule Patient Appointment  Show Description ↓") */}
          {comment.item && (
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigateToItem?.(comment.item!.id)}
                className="font-bold text-[#0088cc] hover:underline text-xs flex items-center gap-1.5 cursor-pointer text-left"
              >
                <span>{comment.item.itemKey}</span>
                <span>{comment.item.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowItemDescription(!showItemDescription)}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-0.5"
              >
                <span>{showItemDescription ? 'Hide Description' : 'Show Description'}</span>
                {showItemDescription ? (
                  <ChevronUp className="w-2.5 h-2.5" />
                ) : (
                  <ChevronDown className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
          )}

          {/* Author line: "Kristi Wolf added a Comment" */}
          <div className="text-xs mb-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {comment.author.fullName}
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">added a Comment</span>
          </div>

          {/* Comment Content */}
          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap break-words mb-2">
            {renderFormattedContent(comment.content)}
          </div>

          {/* Meta line: "6 days ago · Reply · Mute Notifications" */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 select-none">
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="text-[#0088cc] hover:underline font-medium cursor-pointer"
            >
              Reply
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="hover:underline flex items-center gap-1 cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <Mail className="w-3 h-3 text-[#00a2db]" />
              <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indented Thread Replies List */}
      {replies.length > 0 && (
        <div className="mt-3 ml-12 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-2.5 pt-1">
          {replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-2.5 text-xs">
              <div className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center shrink-0">
                {reply.author.avatarUrl ? (
                  <img
                    src={reply.author.avatarUrl}
                    alt={reply.author.fullName}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  reply.author.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {reply.author.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                  {renderFormattedContent(reply.content)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Reply Composer Box matching Image 1 & 2 */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        {isReplying ? (
          <div className="mt-1">
            <JamaStreamComposer
              placeholder="Write a reply..."
              autoFocus
              compact
              members={members}
              onSubmit={async (content, mentionIds) => {
                await onReplySubmit(comment.id, content, mentionIds);
                setIsReplying(false);
              }}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="w-full text-left px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 text-xs hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CornerDownRight className="w-3 h-3 text-slate-400" />
            <span>Add a reply</span>
          </button>
        )}
      </div>
    </div>
  );
};
