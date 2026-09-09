import React from 'react';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import { Settings, Search, Filter, ChevronDown } from 'lucide-react';

export const ProjectSubHeader: React.FC = () => {
  const { currentProject, searchQuery, setSearchQuery } = useProjectStore();
  const { headerTheme } = useThemeStore();

  const isDark = headerTheme === 'dark';

  return (
    <div
      className={`h-10 px-4 flex items-center justify-between text-xs border-b transition-colors select-none ${
        isDark
          ? 'bg-[#2d333b] border-[#22272e] text-slate-200'
          : 'bg-[#e2e8f0] border-slate-300 text-slate-800'
      }`}
    >
      {/* Left: Project Name + Gear Icon */}
      <div className="flex items-center gap-2 font-bold tracking-tight">
        <span className="text-sm">{currentProject?.name || 'Project Workspace'}</span>
        <button
          type="button"
          className={`p-1 rounded transition-colors ${
            isDark ? 'hover:bg-slate-700/60 text-slate-400' : 'hover:bg-slate-300 text-slate-600'
          }`}
          title="Project Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Search Box with Scope Dropdown (Matching Image 3 & 4) */}
      <div className="flex items-center gap-1.5">
        <div
          className={`flex items-center rounded border px-2 py-1 transition-colors ${
            isDark
              ? 'bg-[#1c2128] border-[#373e47] text-slate-200 focus-within:border-blue-500'
              : 'bg-white border-slate-300 text-slate-800 focus-within:border-blue-600'
          }`}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-44 lg:w-56 bg-transparent text-xs focus:outline-none placeholder-slate-400"
          />

          <div className="h-3.5 w-px bg-slate-500/40 mx-2" />

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium cursor-pointer">
            <span>Project</span>
            <ChevronDown className="w-3 h-3" />
          </div>

          <button type="button" className="ml-2 text-slate-400 hover:text-blue-500">
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          className={`p-1.5 rounded border transition-colors ${
            isDark
              ? 'bg-[#1c2128] border-[#373e47] text-slate-400 hover:text-slate-200'
              : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
          }`}
          title="Advanced Filter"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
