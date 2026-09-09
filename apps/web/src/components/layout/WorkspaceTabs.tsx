import React from 'react';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import { Coffee, BarChart2, Folder, X, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ProjectSummary } from '@aljama/shared';

export type WorkspaceTabId = 'welcome' | 'dashboard' | 'workspace';

interface WorkspaceTabsProps {
  projects?: ProjectSummary[];
  activePerspective: WorkspaceTabId;
  openTabs: WorkspaceTabId[];
  onPerspectiveChange: (p: WorkspaceTabId) => void;
  onCloseTab: (p: WorkspaceTabId) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  projects,
  activePerspective,
  openTabs,
  onPerspectiveChange,
  onCloseTab,
}) => {
  const { currentProject, setCurrentProject, isSidebarOpen, toggleSidebar } = useProjectStore();
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  return (
    <div
      className={`h-8 border-b flex items-center justify-between text-xs select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[#21262d] border-[#30363d] text-slate-200'
          : 'bg-[#ebeef2] border-slate-300 text-slate-700'
      }`}
    >
      {/* Left: Project Selector & Collapse toggle (Matching Image 3 & 4) */}
      <div
        className={`flex items-center justify-between px-2 border-r transition-all ${
          isDark ? 'border-[#30363d]' : 'border-slate-300'
        } ${isSidebarOpen ? 'w-72' : 'w-10'}`}
      >
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`font-semibold text-[11px] uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Project
              </span>
              <div className="relative group">
                <select
                  value={currentProject?.id || ''}
                  onChange={(e) => {
                    const sel = projects?.find((p) => p.id === e.target.value);
                    if (sel) setCurrentProject(sel);
                  }}
                  className={`appearance-none bg-transparent hover:text-blue-500 font-bold text-xs cursor-pointer focus:outline-none pr-4 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {projects?.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      className={isDark ? 'bg-[#161b22] text-slate-200' : 'bg-white text-slate-800'}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-0.5 rounded transition-colors ${
                isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-300 text-slate-600'
              }`}
              title="Collapse Sidebar («)"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className={`w-full flex items-center justify-center p-0.5 rounded transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-300 text-slate-600'
            }`}
            title="Expand Sidebar (»)"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right: Tab Bar with close buttons matching Image 3 & 4 */}
      <div className="flex-1 flex items-end h-full px-2 gap-1 overflow-x-auto">
        {/* Welcome Tab */}
        {openTabs.includes('welcome') && (
          <div
            onClick={() => onPerspectiveChange('welcome')}
            className={`group h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
              activePerspective === 'welcome'
                ? isDark
                  ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold shadow-xs'
                  : 'bg-white text-slate-900 border-slate-300 font-semibold shadow-2xs'
                : isDark
                ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Welcome</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab('welcome');
              }}
              className={`p-0.5 rounded ml-1 transition-colors ${
                isDark
                  ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-300/70'
              }`}
              title="Close Welcome Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Dashboard Tab */}
        {openTabs.includes('dashboard') && (
          <div
            onClick={() => onPerspectiveChange('dashboard')}
            className={`group h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
              activePerspective === 'dashboard'
                ? isDark
                  ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold shadow-xs'
                  : 'bg-white text-slate-900 border-slate-300 font-semibold shadow-2xs'
                : isDark
                ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">Dashboard: {currentProject?.name || 'Project'}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab('dashboard');
              }}
              className={`p-0.5 rounded ml-1 transition-colors ${
                isDark
                  ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-300/70'
              }`}
              title="Close Dashboard Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Workspace Tab */}
        {openTabs.includes('workspace') && (
          <div
            onClick={() => onPerspectiveChange('workspace')}
            className={`group h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
              activePerspective === 'workspace'
                ? isDark
                  ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold shadow-xs'
                  : 'bg-white text-slate-900 border-slate-300 font-semibold shadow-2xs'
                : isDark
                ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{currentProject?.name || 'Workspace'}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab('workspace');
              }}
              className={`p-0.5 rounded ml-1 transition-colors ${
                isDark
                  ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-300/70'
              }`}
              title="Close Project Workspace Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
