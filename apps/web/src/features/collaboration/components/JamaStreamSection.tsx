import React, { useState, useMemo } from 'react';
import { useComments, CommentData } from '../hooks/useComments';
import { useProjectMeta } from '../../item/hooks/use-project-meta';
import { JamaStreamComposer } from './JamaStreamComposer';
import { JamaStreamFilterBar } from './JamaStreamFilterBar';
import { JamaStreamCard } from './JamaStreamCard';
import { MessageSquare } from 'lucide-react';

interface JamaStreamSectionProps {
  itemId?: string;
  projectId?: string;
  showStreamHeader?: boolean;
  onNavigateToItem?: (itemId: string) => void;
}

export const JamaStreamSection: React.FC<JamaStreamSectionProps> = ({
  itemId,
  projectId,
  showStreamHeader = false,
  onNavigateToItem,
}) => {
  const { comments, isLoading, isError, createComment } = useComments(itemId, projectId);
  const { members } = useProjectMeta(projectId);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'mentions' | 'questions' | 'starred'>(
    'all',
  );

  // Group root comments and thread replies
  const { rootComments, replyMap } = useMemo(() => {
    const roots: CommentData[] = [];
    const rMap = new Map<string, CommentData[]>();

    for (const c of comments) {
      if (c.parentCommentId) {
        const existing = rMap.get(c.parentCommentId) || [];
        existing.push(c);
        rMap.set(c.parentCommentId, existing);
      } else {
        roots.push(c);
      }
    }

    return { rootComments: roots, replyMap: rMap };
  }, [comments]);

  // Apply filters
  const filteredComments = useMemo(() => {
    return rootComments.filter(c => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = c.content.toLowerCase().includes(q);
        const matchesAuthor = c.author.fullName.toLowerCase().includes(q);
        const matchesItem =
          c.item?.name.toLowerCase().includes(q) || c.item?.itemKey.toLowerCase().includes(q);
        const childReplies = replyMap.get(c.id) || [];
        const matchesChild = childReplies.some(
          r => r.content.toLowerCase().includes(q) || r.author.fullName.toLowerCase().includes(q),
        );
        if (!matchesContent && !matchesAuthor && !matchesItem && !matchesChild) {
          return false;
        }
      }

      // 2. Active filter category
      if (activeFilter === 'mentions') {
        return c.content.includes('@');
      }
      if (activeFilter === 'questions') {
        return (
          c.content.includes('?') ||
          c.content.includes('[Question]') ||
          c.content.includes('[Action Item]')
        );
      }

      return true;
    });
  }, [rootComments, replyMap, searchQuery, activeFilter]);

  const handlePostRootComment = async (content: string, mentionUserIds?: string[]) => {
    await createComment({
      content,
      mentionedUserIds: mentionUserIds,
    });
  };

  const handleReplySubmit = async (
    parentCommentId: string,
    content: string,
    mentionUserIds?: string[],
  ) => {
    await createComment({
      content,
      parentCommentId,
      mentionedUserIds: mentionUserIds,
    });
  };

  return (
    <div className="w-full font-sans">
      {/* Optional Stream Header matching Screen 1 ("Stream") */}
      {showStreamHeader && (
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Stream</h1>
        </div>
      )}

      {/* Main Composer Box matching Screen 1 & Screen 2 */}
      <div className="mb-2">
        <JamaStreamComposer
          placeholder="Add a comment, @mention a person, group, project, item, release or add a #hashtag"
          onSubmit={handlePostRootComment}
          members={members}
        />
      </div>

      {/* Filter Bar matching Screen 1 & Screen 2 */}
      <JamaStreamFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Comments Stream Feed */}
      <div className="space-y-3 mt-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-sm">
            <div className="w-5 h-5 border-2 border-[#00a2db] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading stream discussions...</span>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-xs text-red-500 bg-white dark:bg-[#161b22] border border-red-200 dark:border-red-900/40 rounded-sm">
            Failed to load stream comments.
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-sm flex flex-col items-center justify-center gap-1.5">
            <MessageSquare className="w-6 h-6 text-slate-300 stroke-1" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              No comments found
            </span>
            <span className="text-[11px] text-slate-400 max-w-sm">
              {searchQuery
                ? 'No discussions match your filter criteria.'
                : 'Start the conversation by adding a comment, mentioning colleagues or adding #hashtags.'}
            </span>
          </div>
        ) : (
          filteredComments.map(comment => (
            <JamaStreamCard
              key={comment.id}
              comment={comment}
              replies={replyMap.get(comment.id) || []}
              members={members}
              onReplySubmit={handleReplySubmit}
              onNavigateToItem={onNavigateToItem}
            />
          ))
        )}
      </div>
    </div>
  );
};
