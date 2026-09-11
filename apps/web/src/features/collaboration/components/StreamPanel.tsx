import React, { useState, useRef, useEffect } from 'react';
import { useComments, CommentData } from '../hooks/useComments';
import { CommentItem } from './CommentItem';
import { Send, AtSign, X, MessageSquare, CornerDownRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useProjectMeta } from '../../item/hooks/use-project-meta';
import { useProjectStore } from '../../../stores/project.store';

interface StreamPanelProps {
  itemId?: string;
  projectId?: string;
  title?: string;
  onNavigateToItem?: (itemId: string) => void;
}

export const StreamPanel: React.FC<StreamPanelProps> = ({
  itemId,
  projectId: propProjectId,
  title,
  onNavigateToItem,
}) => {
  const { currentProject } = useProjectStore();
  const effectiveProjectId = propProjectId || currentProject?.id;

  const { comments, isLoading, isError, createComment, isCreating } = useComments(
    itemId,
    effectiveProjectId,
  );
  const { members } = useProjectMeta(effectiveProjectId);

  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Filter members for mention popup
  const filteredMembers = members.filter(m => {
    if (!mentionFilter) return true;
    const q = mentionFilter.toLowerCase();
    return m.username.toLowerCase().includes(q) || m.fullName.toLowerCase().includes(q);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Detect @ typing cursor
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1 && !/\s/.test(textBeforeCursor.slice(lastAtIdx + 1))) {
      setShowMentionMenu(true);
      setMentionFilter(textBeforeCursor.slice(lastAtIdx + 1));
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMember = (member: { userId: string; username: string; fullName: string }) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    const newText = textBeforeCursor.slice(0, lastAtIdx) + `@${member.username} ` + textAfterCursor;

    setContent(newText);
    setSelectedMentionIds(prev => Array.from(new Set([...prev, member.userId])));
    setShowMentionMenu(false);

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleSend = async () => {
    if (!content.trim() || isCreating) return;

    await createComment({
      content: content.trim(),
      parentCommentId: replyingTo?.id,
      mentionedUserIds: selectedMentionIds.length > 0 ? selectedMentionIds : undefined,
    });

    setContent('');
    setReplyingTo(null);
    setSelectedMentionIds([]);
    setShowMentionMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && e.key === 'Escape') {
      setShowMentionMenu(false);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (showMentionMenu && filteredMembers.length > 0) {
        e.preventDefault();
        handleSelectMember(filteredMembers[0]);
        return;
      }
      e.preventDefault();
      handleSend();
    }
  };

  const handleReply = (comment: CommentData) => {
    setReplyingTo({
      id: comment.id,
      authorName: comment.author.fullName,
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
      {/* Optional Stream Header */}
      {title && (
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#161b22]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>{title}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {comments.length} conversation{comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 dark:divide-slate-800/40">
        {isLoading ? (
          <div className="p-6 text-xs text-slate-400 text-center flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading stream conversation...</span>
          </div>
        ) : isError ? (
          <div className="p-4 text-xs text-red-500 text-center">
            Failed to load stream conversation
          </div>
        ) : comments.length === 0 ? (
          <div className="p-6 text-xs text-slate-400 italic text-center flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 stroke-1" />
            <p className="font-medium text-slate-500 dark:text-slate-400">No stream messages yet</p>
            <p className="text-[11px] max-w-xs text-slate-400">
              Collaborate in real-time with colleagues, reply to threads, and use @mention to notify
              collaborators.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onNavigateToItem={onNavigateToItem}
              />
            ))}
            <div ref={streamEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-[#161b22] relative">
        {/* Replying banner */}
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/80 px-2.5 py-1 rounded text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-1.5 truncate">
              <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Replying to <strong className="font-semibold">{replyingTo.authorName}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              title="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mention Suggestions Popup */}
        {showMentionMenu && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-[#1e2329] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22]">
              Mention Project Member
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map(m => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMember(m)}
                  className="px-3 py-2 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.fullName} className="w-6 h-6 rounded-full" />
                    ) : (
                      m.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {m.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">@{m.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Textarea & Actions */}
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a message... (Type @ to mention, Enter to send)"
              className="w-full min-h-[44px] max-h-[140px] bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-md py-2.5 pl-3 pr-8 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed"
              rows={2}
            />
            {/* Quick @ mention button inside textarea */}
            <button
              type="button"
              onClick={() => {
                setContent(prev => prev + '@');
                setShowMentionMenu(true);
                setMentionFilter('');
                textareaRef.current?.focus();
              }}
              className="absolute right-2.5 bottom-2.5 text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
              title="Mention a team member"
            >
              <AtSign className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() || isCreating}
            className="w-10 h-10 shrink-0 rounded-lg bg-[#203a6b] hover:bg-[#1a2f55] text-white shadow-sm"
            title="Send comment"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
