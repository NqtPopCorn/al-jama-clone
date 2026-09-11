import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  Coffee,
  BarChart2,
  Folder,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Layers,
  Check,
  GitFork,
} from 'lucide-react';
import { ProjectSummary } from '@aljama/shared';

export type WorkspaceTabId = 'welcome' | 'dashboard' | 'workspace' | string;

export interface OpenItemTab {
  id: string;
  key: string;
  name: string;
}

interface WorkspaceTabsProps {
  projects?: ProjectSummary[];
  activePerspective: WorkspaceTabId;
  openTabs: WorkspaceTabId[];
  itemTabs?: OpenItemTab[];
  onPerspectiveChange: (p: WorkspaceTabId) => void;
  onCloseTab: (p: WorkspaceTabId) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  projects,
  activePerspective,
  openTabs,
  itemTabs = [],
  onPerspectiveChange,
  onCloseTab,
}) => {
  const { currentProject, setCurrentProject, isSidebarOpen, toggleSidebar } = useProjectStore();
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check scroll boundary to toggle scroll buttons
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const observer = new ResizeObserver(() => {
      checkScroll();
    });
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [openTabs.length, itemTabs.length]);

  // Scroll active tab into view when activePerspective changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector<HTMLElement>(
      `[data-tab-id="${activePerspective}"]`,
    );
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    checkScroll();
  }, [activePerspective, openTabs, itemTabs]);

  // Handle horizontal mouse wheel scrolling over tab bar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      if (e.deltaY !== 0) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -220 : 220;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const totalTabsCount = openTabs.length + itemTabs.length;

  return (
    <div
      className={`h-8 border-b flex items-center justify-between text-xs select-none transition-colors duration-200 relative ${
        isDark
          ? 'bg-[#21262d] border-[#30363d] text-slate-200'
          : 'bg-[#ebeef2] border-slate-300 text-slate-700'
      }`}
    >
      {/* Left: Project Selector & Collapse toggle (Matching Image 3 & 4) */}
      <div
        className={`flex items-center justify-between px-2 border-r transition-all shrink-0 h-full ${
          isDark ? 'border-[#30363d]' : 'border-slate-300'
        } ${isSidebarOpen ? 'w-72' : 'w-10'}`}
      >
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-1.5 font-medium min-w-0">
              <span
                className={`font-semibold text-[11px] uppercase shrink-0 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Project
              </span>
              <div className="relative group min-w-0">
                <select
                  value={currentProject?.id || ''}
                  onChange={e => {
                    const sel = projects?.find(p => p.id === e.target.value);
                    if (sel) setCurrentProject(sel);
                  }}
                  className={`appearance-none bg-transparent hover:text-blue-500 font-bold text-xs cursor-pointer focus:outline-none pr-4 max-w-[150px] truncate ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {projects?.map(p => (
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
              className={`p-0.5 rounded transition-colors shrink-0 ${
                isDark
                  ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                  : 'hover:bg-slate-300 text-slate-600'
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
              isDark
                ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-300 text-slate-600'
            }`}
            title="Expand Sidebar (»)"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Middle: Tab Bar with no-scrollbar and horizontal mouse-wheel support */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex-1 flex items-end h-full px-2 gap-1 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {/* Welcome Tab */}
        {openTabs.includes('welcome') && (
          <div
            data-tab-id="welcome"
            onClick={() => onPerspectiveChange('welcome')}
            className={`group shrink-0 h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors max-w-[160px] relative ${
              activePerspective === 'welcome'
                ? isDark
                  ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold -mb-px border-b border-b-[#0d1117] z-10'
                  : 'bg-white text-slate-900 border-slate-300 font-semibold -mb-px border-b border-b-white z-10'
                : isDark
                  ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                  : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
            }`}
            title="Welcome"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate font-medium">Welcome</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onCloseTab('welcome');
              }}
              className={`p-0.5 rounded ml-1 transition-colors shrink-0 ${
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
            data-tab-id="dashboard"
            onClick={() => onPerspectiveChange('dashboard')}
            className={`group shrink-0 h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors max-w-[200px] relative ${
              activePerspective === 'dashboard'
                ? isDark
                  ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold -mb-px border-b border-b-[#0d1117] z-10'
                  : 'bg-white text-slate-900 border-slate-300 font-semibold -mb-px border-b border-b-white z-10'
                : isDark
                  ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                  : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
            }`}
            title={`Dashboard: ${currentProject?.name || 'Project'}`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate font-medium">
              Dashboard: {currentProject?.name || 'Project'}
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onCloseTab('dashboard');
              }}
              className={`p-0.5 rounded ml-1 transition-colors shrink-0 ${
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
            data-tab-id="workspace"
            onClick={() => onPerspectiveChange('workspace')}
            className={`group shrink-0 h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors max-w-[200px] relative ${
              activePerspective === 'workspace'
                ? isDark
                  ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold -mb-px border-b border-b-[#0d1117] z-10'
                  : 'bg-white text-slate-900 border-slate-300 font-semibold -mb-px border-b border-b-white z-10'
                : isDark
                  ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                  : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
            }`}
            title={currentProject?.name || 'Workspace'}
          >
            <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate font-medium">{currentProject?.name || 'Workspace'}</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onCloseTab('workspace');
              }}
              className={`p-0.5 rounded ml-1 transition-colors shrink-0 ${
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

        {/* Traceability Matrix Tab */}
        {openTabs.includes('traceability') && (
          <div
            data-tab-id="traceability"
            onClick={() => onPerspectiveChange('traceability')}
            className={`group shrink-0 h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors max-w-[200px] relative ${
              activePerspective === 'traceability'
                ? isDark
                  ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold -mb-px border-b border-b-[#0d1117] z-10'
                  : 'bg-white text-slate-900 border-slate-300 font-semibold -mb-px border-b border-b-white z-10'
                : isDark
                  ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                  : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
            }`}
            title={`Traceability Matrix: ${currentProject?.name || 'Project'}`}
          >
            <GitFork className="w-3.5 h-3.5 text-emerald-500 rotate-90 shrink-0" />
            <span className="truncate font-medium">Traceability Matrix</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onCloseTab('traceability');
              }}
              className={`p-0.5 rounded ml-1 transition-colors shrink-0 ${
                isDark
                  ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-300/70'
              }`}
              title="Close Traceability Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Dynamic Item Tabs matching Image 4 & 5 */}
        {itemTabs.map(itemTab => {
          const tabId = `item:${itemTab.id}`;
          const isActive = activePerspective === tabId;
          return (
            <div
              key={itemTab.id}
              data-tab-id={tabId}
              onClick={() => onPerspectiveChange(tabId)}
              className={`group shrink-0 h-7 px-2.5 rounded-t border-t border-l border-r text-xs flex items-center gap-1.5 cursor-pointer transition-colors max-w-[220px] min-w-[120px] relative ${
                isActive
                  ? isDark
                    ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold -mb-px border-b border-b-[#0d1117] z-10'
                    : 'bg-white text-slate-900 border-slate-300 font-semibold -mb-px border-b border-b-white z-10'
                  : isDark
                    ? 'bg-[#161b22] text-slate-400 border-transparent hover:bg-[#282e38] hover:text-slate-200'
                    : 'bg-[#dfe3e8] text-slate-600 border-transparent hover:bg-slate-200'
              }`}
              title={`${itemTab.key}: ${itemTab.name}`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate font-medium flex-1 min-w-0">
                {itemTab.key}: {itemTab.name}
              </span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onCloseTab(tabId);
                }}
                className={`p-0.5 rounded ml-1 transition-colors shrink-0 ${
                  isDark
                    ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-300/70'
                }`}
                title={`Close ${itemTab.key}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Right Controls: Scroll Left/Right arrows + Dropdown list of all open tabs */}
      <div
        className={`flex items-center h-full shrink-0 px-1 gap-0.5 border-l ${
          isDark ? 'border-[#30363d]' : 'border-slate-300'
        }`}
      >
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => scrollByAmount('left')}
          disabled={!canScrollLeft}
          className={`p-1 rounded transition-colors ${
            canScrollLeft
              ? isDark
                ? 'text-slate-300 hover:bg-slate-700 cursor-pointer'
                : 'text-slate-600 hover:bg-slate-300 cursor-pointer'
              : isDark
                ? 'text-slate-600 cursor-not-allowed opacity-30'
                : 'text-slate-400 cursor-not-allowed opacity-30'
          }`}
          title="Scroll tabs left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => scrollByAmount('right')}
          disabled={!canScrollRight}
          className={`p-1 rounded transition-colors ${
            canScrollRight
              ? isDark
                ? 'text-slate-300 hover:bg-slate-700 cursor-pointer'
                : 'text-slate-600 hover:bg-slate-300 cursor-pointer'
              : isDark
                ? 'text-slate-600 cursor-not-allowed opacity-30'
                : 'text-slate-400 cursor-not-allowed opacity-30'
          }`}
          title="Scroll tabs right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* All Tabs Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`px-1.5 py-1 rounded transition-colors flex items-center gap-1 ${
              isDropdownOpen
                ? isDark
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-300 text-slate-900'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  : 'text-slate-600 hover:bg-slate-300 hover:text-slate-800'
            }`}
            title={`Open Tabs List (${totalTabsCount})`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold px-1 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
              {totalTabsCount}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className={`absolute right-0 top-full mt-1 w-72 max-h-80 overflow-y-auto rounded-md shadow-xl border py-1 z-50 text-xs ${
                isDark
                  ? 'bg-[#161b22] border-[#30363d] text-slate-200 shadow-black/60'
                  : 'bg-white border-slate-200 text-slate-800 shadow-slate-300'
              }`}
            >
              <div className="px-3 py-1.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#30363d] flex items-center justify-between">
                <span>Open Tabs ({totalTabsCount})</span>
                {itemTabs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      itemTabs.forEach(t => onCloseTab(`item:${t.id}`));
                      setIsDropdownOpen(false);
                    }}
                    className="text-[10px] lowercase text-red-500 hover:underline cursor-pointer font-normal"
                  >
                    close item tabs
                  </button>
                )}
              </div>

              <div className="py-1">
                {openTabs.includes('welcome') && (
                  <div
                    onClick={() => {
                      onPerspectiveChange('welcome');
                      setIsDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                      activePerspective === 'welcome'
                        ? isDark
                          ? 'bg-blue-900/30 text-blue-400 font-medium'
                          : 'bg-blue-50 text-blue-700 font-medium'
                        : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Welcome</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activePerspective === 'welcome' && (
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onCloseTab('welcome');
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        title="Close tab"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {openTabs.includes('dashboard') && (
                  <div
                    onClick={() => {
                      onPerspectiveChange('dashboard');
                      setIsDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                      activePerspective === 'dashboard'
                        ? isDark
                          ? 'bg-blue-900/30 text-blue-400 font-medium'
                          : 'bg-blue-50 text-blue-700 font-medium'
                        : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">Dashboard: {currentProject?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activePerspective === 'dashboard' && (
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onCloseTab('dashboard');
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        title="Close tab"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {openTabs.includes('workspace') && (
                  <div
                    onClick={() => {
                      onPerspectiveChange('workspace');
                      setIsDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                      activePerspective === 'workspace'
                        ? isDark
                          ? 'bg-blue-900/30 text-blue-400 font-medium'
                          : 'bg-blue-50 text-blue-700 font-medium'
                        : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{currentProject?.name || 'Workspace'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activePerspective === 'workspace' && (
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onCloseTab('workspace');
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        title="Close tab"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {openTabs.includes('traceability') && (
                  <div
                    onClick={() => {
                      onPerspectiveChange('traceability');
                      setIsDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                      activePerspective === 'traceability'
                        ? isDark
                          ? 'bg-blue-900/30 text-blue-400 font-medium'
                          : 'bg-blue-50 text-blue-700 font-medium'
                        : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GitFork className="w-3.5 h-3.5 text-emerald-500 rotate-90 shrink-0" />
                      <span className="truncate">Traceability Matrix</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activePerspective === 'traceability' && (
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onCloseTab('traceability');
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        title="Close tab"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {itemTabs.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-[#30363d] my-1 pt-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                      Items
                    </div>
                    {itemTabs.map(itemTab => {
                      const tabId = `item:${itemTab.id}`;
                      const isActive = activePerspective === tabId;
                      return (
                        <div
                          key={itemTab.id}
                          onClick={() => {
                            onPerspectiveChange(tabId);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isActive
                              ? isDark
                                ? 'bg-blue-900/30 text-blue-400 font-medium'
                                : 'bg-blue-50 text-blue-700 font-medium'
                              : isDark
                                ? 'hover:bg-slate-800 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate" title={`${itemTab.key}: ${itemTab.name}`}>
                              {itemTab.key}: {itemTab.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isActive && <Check className="w-3.5 h-3.5 text-blue-500" />}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                onCloseTab(tabId);
                              }}
                              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                              title="Close tab"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
