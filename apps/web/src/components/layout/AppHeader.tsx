import React from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import { Home, Sun, Moon, LogOut } from 'lucide-react';

export type MainNavTab = 'home' | 'stream' | 'projects' | 'reviews' | 'admin';

interface AppHeaderProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuthStore();
  const { currentProject } = useProjectStore();
  const { headerTheme, toggleHeaderTheme } = useThemeStore();

  const isDark = headerTheme === 'dark';

  return (
    <header
      className={`h-11 border-b transition-colors select-none z-30 flex items-center justify-between px-3 text-xs ${
        isDark
          ? 'bg-[#1e2329] border-[#101418] text-slate-200'
          : 'bg-[#f1f5f9] border-slate-300 text-slate-800'
      }`}
    >
      {/* Left Navigation: Jama Logo + Home + Nav Links (STREAM, PROJECTS, REVIEWS, ADMIN) */}
      <div className="flex items-center h-full gap-1">
        {/* Three-blade Blue Jama Logo */}
        <div
          onClick={() => onTabChange('home')}
          className="cursor-pointer pr-2.5 flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          title="Go to Home"
        >
          <svg viewBox="0 0 100 100" className="w-6 h-6 text-[#0088cc]" fill="currentColor">
            <path
              d="M50 15 C45 15, 38 25, 36 38 C34 50, 42 62, 50 62 C58 62, 66 50, 64 38 C62 25, 55 15, 50 15 Z"
              fill="#0284c7"
            />
            <path
              d="M22 68 C22 62, 32 58, 44 65 C55 72, 58 84, 52 90 C46 96, 32 94, 25 85 C20 78, 22 71, 22 68 Z"
              fill="#0369a1"
            />
            <path
              d="M78 68 C78 62, 68 58, 56 65 C45 72, 42 84, 48 90 C54 96, 68 94, 75 85 C80 78, 78 71, 78 68 Z"
              fill="#38bdf8"
            />
          </svg>
        </div>

        {/* Home Icon Tab */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`h-full px-3 flex items-center justify-center transition-colors border-b-2 font-semibold ${
            activeTab === 'home'
              ? isDark
                ? 'bg-[#2a3038] text-white border-[#0088cc]'
                : 'bg-white text-blue-700 border-blue-600 shadow-sm'
              : isDark
                ? 'text-slate-300 hover:bg-[#252b33] hover:text-white border-transparent'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border-transparent'
          }`}
          title="Home Overview (BR-NAV-02)"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* STREAM */}
        <button
          type="button"
          onClick={() => onTabChange('stream')}
          className={`h-full px-4 flex items-center font-bold tracking-wide uppercase transition-colors border-b-2 text-[11px] ${
            activeTab === 'stream'
              ? isDark
                ? 'bg-[#2a3038] text-white border-[#0088cc]'
                : 'bg-white text-blue-700 border-blue-600 shadow-sm'
              : isDark
                ? 'text-slate-300 hover:bg-[#252b33] hover:text-white border-transparent'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border-transparent'
          }`}
        >
          Stream
        </button>

        {/* PROJECTS (Default workspace) */}
        <button
          type="button"
          onClick={() => onTabChange('projects')}
          className={`h-full px-4 flex items-center font-bold tracking-wide uppercase transition-colors border-b-2 text-[11px] ${
            activeTab === 'projects'
              ? isDark
                ? 'bg-[#2a3038] text-white border-[#0088cc]'
                : 'bg-white text-blue-700 border-blue-600 shadow-sm'
              : isDark
                ? 'text-slate-300 hover:bg-[#252b33] hover:text-white border-transparent'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border-transparent'
          }`}
        >
          Projects
        </button>

        {/* REVIEWS */}
        <button
          type="button"
          onClick={() => onTabChange('reviews')}
          className={`h-full px-4 flex items-center font-bold tracking-wide uppercase transition-colors border-b-2 text-[11px] ${
            activeTab === 'reviews'
              ? isDark
                ? 'bg-[#2a3038] text-white border-[#0088cc]'
                : 'bg-white text-blue-700 border-blue-600 shadow-sm'
              : isDark
                ? 'text-slate-300 hover:bg-[#252b33] hover:text-white border-transparent'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border-transparent'
          }`}
        >
          Reviews
        </button>

        {/* ADMIN */}
        <button
          type="button"
          onClick={() => onTabChange('admin')}
          className={`h-full px-4 flex items-center font-bold tracking-wide uppercase transition-colors border-b-2 text-[11px] ${
            activeTab === 'admin'
              ? isDark
                ? 'bg-[#2a3038] text-white border-[#0088cc]'
                : 'bg-white text-blue-700 border-blue-600 shadow-sm'
              : isDark
                ? 'text-slate-300 hover:bg-[#252b33] hover:text-white border-transparent'
                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border-transparent'
          }`}
        >
          Admin
        </button>
      </div>

      {/* Right User & Utility Area (Matching Jama Connect) */}
      <div className="flex items-center gap-4 text-xs font-normal">
        {/* Org Name */}
        <span
          className={`font-semibold hidden sm:inline ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
        >
          Jama Software
        </span>

        {/* Theme Toggle Button (Dark / Light header as requested) */}
        <button
          type="button"
          onClick={toggleHeaderTheme}
          className={`p-1.5 rounded flex items-center gap-1 text-[11px] font-medium transition-colors ${
            isDark
              ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
          title={`Switch header theme to ${isDark ? 'Light' : 'Dark'}`}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] hidden md:inline text-slate-300">Light Header</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[10px] hidden md:inline text-slate-700">Dark Header</span>
            </>
          )}
        </button>

        {/* User Full Name */}
        <span className={`truncate max-w-[150px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {user?.fullName || 'User'}
        </span>

        {/* Action Links: Reports | Help | Log Out */}
        <div
          className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        >
          <a
            href="#reports"
            onClick={e => {
              e.preventDefault();
              alert('Reports view is available in Project Dashboard and Trace View.');
            }}
            className="hover:underline"
          >
            Reports
          </a>
          <span>|</span>
          <a
            href="#help"
            onClick={e => {
              e.preventDefault();
              alert('AL-JAMA Documentation and User Guides available in docs/.');
            }}
            className="hover:underline"
          >
            Help
          </a>
          <span>|</span>
          <button
            type="button"
            onClick={logout}
            className="hover:underline hover:text-red-400 font-medium"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
};
