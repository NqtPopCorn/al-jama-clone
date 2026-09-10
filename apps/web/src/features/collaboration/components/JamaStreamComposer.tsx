import React, { useState, useRef, useEffect } from 'react';
import {
  AtSign,
  Hash,
  Image as ImageIcon,
  ChevronDown,
  Check,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { ProjectMemberSummary } from '@aljama/shared';

interface JamaStreamComposerProps {
  placeholder?: string;
  onSubmit: (content: string, mentionUserIds?: string[]) => Promise<void>;
  onCancel?: () => void;
  members?: ProjectMemberSummary[];
  autoFocus?: boolean;
  compact?: boolean;
  initialContent?: string;
}

export const JamaStreamComposer: React.FC<JamaStreamComposerProps> = ({
  placeholder = 'Add a comment, @mention a person, group, project, item, release or add a #hashtag',
  onSubmit,
  onCancel,
  members = [],
  autoFocus = false,
  compact = false,
  initialContent = '',
}) => {
  const [content, setContent] = useState(initialContent);
  const [isFocused, setIsFocused] = useState(autoFocus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);

  // Mention dropdown state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // Actions dropdown state
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
        setShowMentionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMembers = members.filter(m => {
    if (!mentionFilter) return true;
    const q = mentionFilter.toLowerCase();
    return m.username.toLowerCase().includes(q) || m.fullName.toLowerCase().includes(q);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

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

  const handleSelectMember = (member: ProjectMemberSummary) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    const newText = textBeforeCursor.slice(0, lastAtIdx) + `@${member.username} ` + textAfterCursor;

    setContent(newText);
    setSelectedMentionIds(prev => Array.from(new Set([...prev, member.userId])));
    setShowMentionMenu(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleInsertChar = (char: '@' | '#') => {
    setContent(prev => prev + char);
    if (char === '@') {
      setShowMentionMenu(true);
      setMentionFilter('');
    }
    textareaRef.current?.focus();
  };

  const handleInsertAction = (actionText: string) => {
    setContent(prev => (prev ? `${prev} [${actionText}] ` : `[${actionText}] `));
    setShowActionsMenu(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSubmit(content.trim(), selectedMentionIds);
      setContent('');
      setSelectedMentionIds([]);
      setIsFocused(false);
      setShowMentionMenu(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setSelectedMentionIds([]);
    setIsFocused(false);
    setShowMentionMenu(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && e.key === 'Escape') {
      setShowMentionMenu(false);
      return;
    }

    if (showMentionMenu && e.key === 'Enter' && filteredMembers.length > 0) {
      e.preventDefault();
      handleSelectMember(filteredMembers[0]);
      return;
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] rounded-sm p-2 transition-all relative ${
        isFocused ? 'shadow-sm border-[#00a2db] ring-1 ring-[#00a2db]/20' : ''
      }`}
    >
      {/* Input Line Area */}
      <div className="relative">
        {/* Main Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={compact && !isFocused && !content ? 1 : 2}
          className="w-full text-xs text-slate-800 dark:text-slate-200 bg-transparent resize-y outline-none placeholder:text-slate-400 font-sans leading-relaxed block"
        />

        {/* Mention Picker Popup: Placed right below the input line */}
        {showMentionMenu && filteredMembers.length > 0 && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-[#1e2329] border border-slate-200 dark:border-slate-700 rounded shadow-xl z-50 max-h-48 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 sticky top-0">
              Mention Member
            </div>
            {filteredMembers.map(m => (
              <div
                key={m.id}
                onClick={() => handleSelectMember(m)}
                className="px-2.5 py-1.5 flex items-center gap-2 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer text-xs transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[#0088cc] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  {m.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate min-w-0">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {m.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1.5">@{m.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Toolbar matching Jama Connect */}
      {(isFocused || content || !compact) && (
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Left Buttons: Comment & Cancel */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="h-7 px-3 text-xs font-semibold text-white bg-[#00a2db] hover:bg-[#008fbf] disabled:opacity-50 disabled:pointer-events-none rounded-sm transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                'Comment'
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="h-7 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-[#f4f6f8] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 rounded-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Right Toolbar: @, #, Image, Actions v */}
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            {/* Mention button */}
            <button
              type="button"
              onClick={() => handleInsertChar('@')}
              className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-xs"
              title="Mention a person or item (@)"
            >
              <AtSign className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Hashtag button */}
            <button
              type="button"
              onClick={() => handleInsertChar('#')}
              className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-xs"
              title="Add a hashtag (#)"
            >
              <Hash className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Image button */}
            <button
              type="button"
              onClick={() => handleInsertChar('#')}
              className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              title="Insert image / screenshot"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Actions dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="h-6 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
              >
                <span>Actions</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1e2329] border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-40 text-xs">
                  <button
                    type="button"
                    onClick={() => handleInsertAction('Question')}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>Flag Question</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertAction('Action Item')}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Assign Action</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertAction('Decision')}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Record Decision</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
