import React, { useState } from 'react';
import { ExplorerNode, LicenseType } from '@aljama/shared';
import { useProjectStore } from '../../stores/project.store';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  Folder,
  Plus,
  Minus,
  Settings,
  User,
  Filter,
  Bookmark,
  LayoutGrid,
  ChevronDown,
  BarChart2,
  Monitor,
  Smartphone,
  Layers,
  CalendarCheck,
  CheckCircle2,
  Bug,
  GitBranch,
  Tag,
  Lock,
} from 'lucide-react';

interface ExplorerSidebarProps {
  nodes?: ExplorerNode[];
  isLoading?: boolean;
}

export const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({ nodes = [], isLoading }) => {
  const { user } = useAuthStore();
  const {
    currentProject,
    selectedFolderId,
    setSelectedFolderId,
    selectedItemId,
    setSelectedItemId,
  } = useProjectStore();

  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const [activeTab, setActiveTab] = useState<'explorer' | 'filter' | 'bookmarks' | 'views'>('explorer');
  const [tagTab, setTagTab] = useState<'cloud' | 'list'>('cloud');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['root', 'f-mobile', 'f-req'])
  );

  // License check: Reviewer Limited (QT-08)
  if (user?.licenseType === LicenseType.REVIEWER_LIMITED) {
    return (
      <div
        className={`h-full flex flex-col p-4 border-r text-xs select-none ${
          isDark ? 'bg-[#161b22] border-[#30363d] text-slate-200' : 'bg-[#f1f3f5] border-slate-300 text-slate-800'
        }`}
      >
        <div
          className={`p-4 border rounded-md text-center space-y-2 shadow-xs ${
            isDark ? 'bg-[#21262d] border-amber-500/40 text-slate-200' : 'bg-white border-amber-300 text-slate-800'
          }`}
        >
          <Lock className="w-6 h-6 text-amber-500 mx-auto" />
          <h4 className="font-bold">Explorer Restricted</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Reviewer Limited users (QT-08) cannot access project hierarchy. Assigned items will appear in Review Center.
          </p>
        </div>
      </div>
    );
  }

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderKey)) {
        next.delete(folderKey);
      } else {
        next.add(folderKey);
      }
      return next;
    });
  };

  return (
    <div
      className={`h-full flex flex-col border-r text-xs select-none transition-colors duration-200 ${
        isDark ? 'bg-[#161b22] border-[#30363d] text-slate-200' : 'bg-[#f5f6f8] border-slate-300 text-slate-800'
      }`}
    >
      {/* 1. Top Tab Strip (Explorer | Filter | Bookmarks | Views) matching Image 3 */}
      <div
        className={`h-8 border-b flex items-center px-1 gap-1 transition-colors duration-200 ${
          isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#e4e7eb] border-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('explorer')}
          className={`h-6 px-2.5 rounded-t text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'explorer'
              ? isDark
                ? 'bg-[#161b22] text-white border-t border-l border-r border-[#30363d] shadow-2xs'
                : 'bg-white text-slate-900 border-t border-l border-r border-slate-300 shadow-2xs'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-[#282e38]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
        >
          <Folder className="w-3.5 h-3.5 text-blue-500" />
          <span>Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('filter')}
          className={`p-1.5 rounded transition-colors ${
            isDark
              ? activeTab === 'filter'
                ? 'bg-[#161b22] text-blue-400'
                : 'text-slate-400 hover:bg-[#282e38] hover:text-slate-200'
              : activeTab === 'filter'
              ? 'bg-white shadow-2xs text-blue-600'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="Filter Results"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookmarks')}
          className={`p-1.5 rounded transition-colors ${
            isDark
              ? activeTab === 'bookmarks'
                ? 'bg-[#161b22] text-blue-400'
                : 'text-slate-400 hover:bg-[#282e38] hover:text-slate-200'
              : activeTab === 'bookmarks'
              ? 'bg-white shadow-2xs text-blue-600'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="Bookmarks"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('views')}
          className={`p-1.5 rounded transition-colors ${
            isDark
              ? activeTab === 'views'
                ? 'bg-[#161b22] text-blue-400'
                : 'text-slate-400 hover:bg-[#282e38] hover:text-slate-200'
              : activeTab === 'views'
              ? 'bg-white shadow-2xs text-blue-600'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="Views Layout"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Sub-Toolbar: + Add ▼ and Tools Gear matching Image 3 */}
      <div
        className={`h-8 px-2 border-b flex items-center justify-between transition-colors duration-200 ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => alert('Add Item / Folder workflow available via toolbar.')}
          className={`px-2 py-0.5 rounded border text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors ${
            isDark
              ? 'bg-[#21262d] border-[#30363d] text-slate-200 hover:bg-[#282e38]'
              : 'bg-[#f8fafc] border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-3 h-3 text-slate-400" />
          <span>Add</span>
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title="Explorer Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-slate-700 text-cyan-400' : 'hover:bg-slate-100 text-cyan-600'
            }`}
            title="Connected Users on Explorer"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Folder Tree Hierarchy matching Image 3 & 4 */}
      <div
        className={`flex-1 overflow-y-auto p-2 space-y-1 font-sans text-xs transition-colors duration-200 ${
          isDark ? 'bg-[#0d1117]' : 'bg-white'
        }`}
      >
        {/* Root Node: Project Name */}
        <div
          onClick={() => setSelectedFolderId(null)}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
            selectedFolderId === null
              ? isDark
                ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                : 'bg-[#e0efff] text-blue-900 font-semibold'
              : isDark
              ? 'hover:bg-[#1f242c] text-slate-200'
              : 'hover:bg-slate-100 text-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder('root');
            }}
            className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] rounded-2xs font-mono ${
              isDark ? 'border-slate-600 bg-[#161b22] text-slate-300 hover:bg-[#21262d]' : 'border-slate-400 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {expandedFolders.has('root') ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
          </button>

          <Folder className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{currentProject?.name || 'Medical Device Control System'}</span>
        </div>

        {/* Tree Items when Root Expanded */}
        {expandedFolders.has('root') && (
          <div className={`pl-4 space-y-0.5 border-l ml-2 ${isDark ? 'border-[#30363d]' : 'border-slate-200'}`}>
            {/* 1. Business Requirements */}
            <div
              onClick={() => setSelectedFolderId('f-req')}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
                selectedFolderId === 'f-req'
                  ? isDark
                    ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                    : 'bg-[#e0efff] text-blue-900 font-semibold'
                  : isDark
                  ? 'hover:bg-[#1f242c] text-slate-200'
                  : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder('f-req');
                }}
                className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] rounded-2xs font-mono ${
                  isDark ? 'border-slate-600 bg-[#161b22] text-slate-300' : 'border-slate-400 bg-white text-slate-600'
                }`}
              >
                {expandedFolders.has('f-req') ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
              </button>
              <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">Business Requirements</span>
            </div>

            {/* Sub items under Business Requirements */}
            {expandedFolders.has('f-req') && (
              <div className={`pl-4 space-y-0.5 border-l ml-2 ${isDark ? 'border-[#30363d]' : 'border-slate-200'}`}>
                <div
                  onClick={() => setSelectedItemId('item-txt-1')}
                  className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer text-[11px] ${
                    isDark ? 'hover:bg-[#1f242c] text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-slate-500 font-mono">T</span>
                  <span className="truncate">Problem Statement</span>
                </div>
                <div
                  onClick={() => setSelectedItemId('item-txt-2')}
                  className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer text-[11px] ${
                    isDark ? 'hover:bg-[#1f242c] text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-slate-500 font-mono">T</span>
                  <span className="truncate">Position Statement</span>
                </div>
              </div>
            )}

            {/* 2. Desktop Browser */}
            <div
              onClick={() => setSelectedFolderId('f-desktop')}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
                selectedFolderId === 'f-desktop'
                  ? isDark
                    ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                    : 'bg-[#e0efff] text-blue-900 font-semibold'
                  : isDark
                  ? 'hover:bg-[#1f242c] text-slate-200'
                  : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder('f-desktop');
                }}
                className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] rounded-2xs font-mono ${
                  isDark ? 'border-slate-600 bg-[#161b22] text-slate-300' : 'border-slate-400 bg-white text-slate-600'
                }`}
              >
                {expandedFolders.has('f-desktop') ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
              </button>
              <Monitor className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">Desktop Browser</span>
            </div>

            {/* 3. Mobile Browser (Expanded in Image 3) */}
            <div
              onClick={() => setSelectedFolderId('f-mobile')}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
                selectedFolderId === 'f-mobile'
                  ? isDark
                    ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                    : 'bg-[#e0efff] text-blue-900 font-semibold'
                  : isDark
                  ? 'hover:bg-[#1f242c] text-slate-200'
                  : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder('f-mobile');
                }}
                className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] rounded-2xs font-mono ${
                  isDark ? 'border-slate-600 bg-[#161b22] text-slate-300' : 'border-slate-400 bg-white text-slate-600'
                }`}
              >
                {expandedFolders.has('f-mobile') ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
              </button>
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate">Mobile Browser</span>
            </div>

            {/* Sub-items under Mobile Browser */}
            {expandedFolders.has('f-mobile') && (
              <div className={`pl-4 space-y-0.5 border-l ml-2 ${isDark ? 'border-[#30363d]' : 'border-slate-200'}`}>
                {/* Use Cases */}
                <div
                  onClick={() => setSelectedFolderId('f-uc')}
                  className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer ${
                    isDark ? 'hover:bg-[#1f242c] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder('f-uc');
                    }}
                    className={`w-3 h-3 flex items-center justify-center border text-[9px] font-mono ${
                      isDark ? 'border-slate-600 bg-[#161b22] text-slate-300' : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <Plus className="w-2 h-2" />
                  </button>
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span className="truncate">Use Cases</span>
                </div>

                {/* Functional Requirements */}
                <div
                  onClick={() => setSelectedFolderId('f-func')}
                  className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer ${
                    isDark ? 'hover:bg-[#1f242c] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder('f-func');
                    }}
                    className={`w-3 h-3 flex items-center justify-center border text-[9px] font-mono ${
                      isDark ? 'border-slate-600 bg-[#161b22] text-slate-300' : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <Plus className="w-2 h-2" />
                  </button>
                  <CalendarCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">Functional Requirements</span>
                </div>

                {/* Test Cases */}
                <div
                  onClick={() => setSelectedFolderId('f-tc')}
                  className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer ${
                    isDark ? 'hover:bg-[#1f242c] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="w-3" />
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="truncate">Test Cases</span>
                </div>

                {/* Defects */}
                <div
                  onClick={() => setSelectedFolderId('f-defects')}
                  className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer ${
                    isDark ? 'hover:bg-[#1f242c] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="w-3" />
                  <Bug className="w-3.5 h-3.5 text-red-500" />
                  <span className="truncate">Defects</span>
                </div>
              </div>
            )}

            {/* 4. Change Requests */}
            <div
              onClick={() => setSelectedFolderId('f-cr')}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
                selectedFolderId === 'f-cr'
                  ? isDark
                    ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                    : 'bg-[#e0efff] text-blue-900 font-semibold'
                  : isDark
                  ? 'hover:bg-[#1f242c] text-slate-200'
                  : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder('f-cr');
                }}
                className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] rounded-2xs font-mono ${
                  isDark ? 'border-slate-600 bg-[#161b22] text-slate-300' : 'border-slate-400 bg-white text-slate-600'
                }`}
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Change Requests</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Tag Cloud Panel matching Image 3 & 4 */}
      <div
        className={`h-36 border-t flex flex-col transition-colors duration-200 ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f8fafc] border-slate-300'
        }`}
      >
        {/* Tag Toolbar */}
        <div
          className={`h-7 px-2 border-b flex items-center justify-between text-[11px] ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#eef2f6] border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`flex items-center gap-1 font-semibold transition-colors ${
                isDark ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Add Tag</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTagTab('cloud')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                tagTab === 'cloud'
                  ? isDark
                    ? 'bg-[#161b22] font-semibold text-blue-400'
                    : 'bg-white font-semibold text-blue-600 shadow-2xs'
                  : 'text-slate-400'
              }`}
            >
              Cloud
            </button>
            <button
              type="button"
              onClick={() => setTagTab('list')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                tagTab === 'list'
                  ? isDark
                    ? 'bg-[#161b22] font-semibold text-blue-400'
                    : 'bg-white font-semibold text-blue-600 shadow-2xs'
                  : 'text-slate-400'
              }`}
            >
              List
            </button>
            <button
              type="button"
              className={`p-0.5 transition-colors ${
                isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tag Cloud content matching Image 3 */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-wrap gap-2 items-center content-start">
          <span className="text-lg font-bold text-[#0088cc] cursor-pointer hover:underline">
            cart(3)
          </span>
          <span className={`text-xs cursor-pointer hover:underline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            product detail(0)
          </span>
          <span className={`text-xs cursor-pointer hover:underline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            product listing(0)
          </span>
          <span className="text-sm font-semibold text-[#0284c7] cursor-pointer hover:underline">
            shipping message(1)
          </span>
        </div>
      </div>
    </div>
  );
};
