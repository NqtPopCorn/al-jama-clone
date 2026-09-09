import React from 'react';
import { GitFork, Users, MessageSquare, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme.store';

export type RightBarPanel =
  'relationships' | 'connected_users' | 'comments' | 'activity' | 'versions' | null;

interface ItemRightBarProps {
  activePanel: RightBarPanel;
  onTogglePanel: (panel: RightBarPanel) => void;
  relationshipsCount?: number;
  connectedUsersCount?: number;
  commentsCount?: number;
  currentVersion?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ItemRightBar: React.FC<ItemRightBarProps> = ({
  activePanel,
  onTogglePanel,
  relationshipsCount = 0,
  connectedUsersCount = 1,
  commentsCount = 0,
  currentVersion = 1,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const handleClick = (panel: RightBarPanel) => {
    if (activePanel === panel) {
      onTogglePanel(null); // Close if already open
    } else {
      onTogglePanel(panel);
    }
  };

  return (
    <aside
      className={`w-14 border-l flex flex-col items-center py-3 gap-3 shrink-0 select-none z-10 transition-colors ${
        isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f7f9fa] border-slate-200'
      }`}
    >
      {/* 1. Relationships (Liên kết) matching Image 4 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleClick('relationships')}
          title="Relationships (Liên kết upstream/downstream)"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs border ${
            activePanel === 'relationships'
              ? 'bg-[#990033] text-white border-[#990033] ring-2 ring-red-400/40'
              : isDark
                ? 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#282e38]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <GitFork className="w-4 h-4 rotate-90" />
        </button>
        {/* Maroon / Red circular badge matching Image 4 */}
        <span
          className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-[#990033] text-white shadow-xs"
          title={`${relationshipsCount} relationships`}
        >
          {relationshipsCount}
        </span>
      </div>

      {/* 2. Connected Users (Người tham gia) matching Image 4 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleClick('connected_users')}
          title="Connected Users (Người tham gia - BR-COLLAB-07)"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs border ${
            activePanel === 'connected_users'
              ? 'bg-[#0088cc] text-white border-[#0088cc] ring-2 ring-blue-400/40'
              : isDark
                ? 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#282e38]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
        </button>
        {/* Blue circular badge matching Image 4 */}
        <span
          className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-[#0088cc] text-white shadow-xs"
          title={`${connectedUsersCount} connected users`}
        >
          {connectedUsersCount}
        </span>
      </div>

      {/* 3. Comments / Stream (Bình luận) matching Image 4 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleClick('comments')}
          title="Comments / Stream (Bình luận & Trao đổi)"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs border ${
            activePanel === 'comments'
              ? 'bg-[#0088cc] text-white border-[#0088cc] ring-2 ring-blue-400/40'
              : isDark
                ? 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#282e38]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        {commentsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-[#0088cc] text-white shadow-xs">
            {commentsCount}
          </span>
        )}
      </div>

      {/* 4. Activity / Pulse (Thống kê / Hoạt động) matching Image 4 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleClick('activity')}
          title="Activity Log (Thống kê hoạt động gần đây)"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs border ${
            activePanel === 'activity'
              ? 'bg-[#0088cc] text-white border-[#0088cc] ring-2 ring-blue-400/40'
              : isDark
                ? 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#282e38]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Versions (Phiên bản) matching Image 4 & 5 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleClick('versions')}
          title="Versions History & Compare (Lịch sử phiên bản)"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs border ${
            activePanel === 'versions'
              ? 'bg-[#24a0d9] text-white border-[#24a0d9] ring-2 ring-cyan-400/40 font-bold'
              : isDark
                ? 'bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#282e38]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-bold font-mono">V</span>
        </button>
        {/* Cyan badge with current version number matching Image 4 */}
        <span
          className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-[#24a0d9] text-white shadow-xs"
          title={`Current Version: v${currentVersion}`}
        >
          {currentVersion}
        </span>
      </div>

      <div className="flex-1" />

      {/* Expand / Collapse Full Width Toggle */}
      {onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          title={isExpanded ? 'Restore View' : 'Maximize Editor'}
          className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          {isExpanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </aside>
  );
};
