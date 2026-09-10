import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../lib/api';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  isDark?: boolean;
  onNavigateToItem?: (itemId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isDark,
  onNavigateToItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 1. Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data as { count: number };
    },
    refetchInterval: 15000, // Poll every 15s for new notifications
  });

  // 2. Fetch notifications list
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<AppNotification[]> => {
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: isOpen,
  });

  // 3. Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 4. Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = unreadData?.count || 0;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsReadMutation.mutateAsync(notif.id);
    }
    setIsOpen(false);

    if (notif.linkUrl) {
      // If it points to an item (/items/:id)
      const itemMatch = notif.linkUrl.match(/\/items\/([0-9a-fA-F-]+)/);
      if (itemMatch && itemMatch[1] && onNavigateToItem) {
        onNavigateToItem(itemMatch[1]);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-1.5 rounded transition-colors ${
          isDark
            ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
            : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
        }`}
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1e2329] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#161b22]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No notifications right now
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-start gap-2.5 ${
                    !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : 'bg-transparent opacity-85'
                  }`}
                >
                  <div className="pt-0.5">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        !n.isRead ? 'bg-blue-600' : 'bg-transparent'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {n.content}
                    </p>
                    {n.linkUrl && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                        <span>View detail</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
