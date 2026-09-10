import React, { useState, useEffect, useMemo } from 'react';
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
  FileText,
  Layers,
  CheckCircle2,
  Bug,
  Target,
  Tag,
  Lock,
} from 'lucide-react';

interface ExplorerSidebarProps {
  nodes?: ExplorerNode[];
  isLoading?: boolean;
  activePerspective?: string;
  onSelectRootDashboard?: () => void;
  onSelectFolder?: (folderId: string | null) => void;
  onSelectItem?: (itemId: string, key: string, name: string) => void;
  onOpenCreateItem?: () => void;
}

export const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({
  nodes = [],
  isLoading,
  activePerspective,
  onSelectRootDashboard,
  onSelectFolder,
  onSelectItem,
  onOpenCreateItem,
}) => {
  const { user } = useAuthStore();
  const {
    currentProject,
    selectedFolderId,
    setSelectedFolderId,
    selectedItemId,
    setSelectedItemId,
    itemTypeFilter,
    setItemTypeFilter,
    statusFilter,
    setStatusFilter,
  } = useProjectStore();

  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const [activeTab, setActiveTab] = useState<'explorer' | 'filter' | 'bookmarks' | 'views'>(
    'explorer',
  );
  const [tagTab, setTagTab] = useState<'cloud' | 'list'>('cloud');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Automatically expand top-level folders when nodes load
  useEffect(() => {
    if (nodes.length > 0) {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.add('root');
        nodes.forEach(n => {
          if (n.type === 'folder') next.add(n.id);
        });
        return next;
      });
    }
  }, [nodes]);

  // Extract real metrics from live tree nodes
  const { typeCounts, statusCounts, totalItemCount } = useMemo(() => {
    const tCounts: Record<string, number> = {};
    const sCounts: Record<string, number> = {};
    let total = 0;

    const countRecursive = (nodeList: ExplorerNode[]) => {
      for (const node of nodeList) {
        if (node.type === 'item') {
          total++;
          const t = node.itemTypeKey || 'ITEM';
          tCounts[t] = (tCounts[t] || 0) + 1;

          const s = node.status || 'Draft';
          sCounts[s] = (sCounts[s] || 0) + 1;
        }
        if (node.children && node.children.length > 0) {
          countRecursive(node.children);
        }
      }
    };

    countRecursive(nodes);
    return { typeCounts: tCounts, statusCounts: sCounts, totalItemCount: total };
  }, [nodes]);

  // License check: Reviewer Limited (QT-08)
  if (user?.licenseType === LicenseType.REVIEWER_LIMITED) {
    return (
      <div
        className={`h-full flex flex-col p-4 border-r text-xs select-none ${
          isDark
            ? 'bg-[#161b22] border-[#30363d] text-slate-200'
            : 'bg-[#f1f3f5] border-slate-300 text-slate-800'
        }`}
      >
        <div
          className={`p-4 border rounded-md text-center space-y-2 shadow-xs ${
            isDark
              ? 'bg-[#21262d] border-amber-500/40 text-slate-200'
              : 'bg-white border-amber-300 text-slate-800'
          }`}
        >
          <Lock className="w-6 h-6 text-amber-500 mx-auto" />
          <h4 className="font-bold">Explorer Restricted</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Reviewer Limited users (QT-08) cannot access project hierarchy. Assigned items will
            appear in Review Center.
          </p>
        </div>
      </div>
    );
  }

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderKey)) {
        next.delete(folderKey);
      } else {
        next.add(folderKey);
      }
      return next;
    });
  };

  const isRootActive = activePerspective === 'dashboard' && selectedFolderId === null;

  const handleRootClick = () => {
    if (onSelectRootDashboard) {
      onSelectRootDashboard();
    } else {
      setSelectedFolderId(null);
    }
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedItemId(null);
    if (onSelectFolder) {
      onSelectFolder(folderId);
    }
  };

  const handleItemClick = (itemId: string, itemKey: string, itemName: string) => {
    setSelectedItemId(itemId);
    if (onSelectItem) {
      onSelectItem(itemId, itemKey, itemName);
    }
  };

  const renderItemIcon = (typeKey?: string) => {
    switch (typeKey) {
      case 'UN':
        return <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'REQ':
        return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'UC':
        return <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      case 'TC':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'DEFECT':
        return <Bug className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: ExplorerNode, depth = 0) => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = selectedFolderId === node.id;
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id} className="space-y-0.5">
          <div
            onClick={() => handleFolderClick(node.id)}
            className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
              isSelected
                ? isDark
                  ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                  : 'bg-[#e0efff] text-blue-900 font-semibold'
                : isDark
                  ? 'hover:bg-[#1f242c] text-slate-200'
                  : 'hover:bg-slate-100 text-slate-800'
            }`}
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
            title={node.name}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
                className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] rounded-2xs font-mono shrink-0 ${
                  isDark
                    ? 'border-slate-600 bg-[#161b22] text-slate-300 hover:bg-[#21262d]'
                    : 'border-slate-400 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isExpanded ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
              </button>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}

            <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate flex-1">{node.name}</span>
            {hasChildren && (
              <span className="text-[10px] opacity-60 font-mono shrink-0">
                ({node.children!.length})
              </span>
            )}
          </div>

          {isExpanded && hasChildren && (
            <div className={`border-l ml-3 ${isDark ? 'border-[#30363d]' : 'border-slate-200'}`}>
              {node.children!.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      // Item node
      const isSelected = selectedItemId === node.id || activePerspective === `item:${node.id}`;

      return (
        <div
          key={node.id}
          onClick={() => handleItemClick(node.id, node.key || '', node.name)}
          className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer transition-colors text-[11px] ${
            isSelected
              ? isDark
                ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                : 'bg-[#e0efff] text-blue-900 font-semibold'
              : isDark
                ? 'hover:bg-[#1f242c] text-slate-300'
                : 'hover:bg-slate-100 text-slate-700'
          }`}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          title={`${node.key}: ${node.name}`}
        >
          {renderItemIcon(node.itemTypeKey)}
          <span className="font-mono text-[10px] text-[#0088cc] shrink-0 font-bold">
            {node.key}
          </span>
          <span className="truncate flex-1">{node.name}</span>
        </div>
      );
    }
  };

  return (
    <div
      className={`h-full flex flex-col border-r text-xs select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[#161b22] border-[#30363d] text-slate-200'
          : 'bg-[#f5f6f8] border-slate-300 text-slate-800'
      }`}
    >
      {/* 1. Top Tab Strip (Explorer | Filter | Bookmarks | Views) */}
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

      {/* 2. Sub-Toolbar: + Add ▼ and Tools Gear */}
      <div
        className={`h-8 px-2 border-b flex items-center justify-between transition-colors duration-200 ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (onOpenCreateItem) {
              onOpenCreateItem();
            }
          }}
          className={`px-2 py-0.5 rounded border text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors ${
            isDark
              ? 'bg-[#21262d] border-[#30363d] text-slate-200 hover:bg-[#282e38]'
              : 'bg-[#f8fafc] border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          title="Create New Item"
        >
          <Plus className="w-3 h-3 text-blue-500" />
          <span>Add</span>
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`p-1 rounded transition-colors ${
              isDark
                ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
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

      {/* 3. Folder Tree Hierarchy */}
      <div
        className={`flex-1 overflow-y-auto p-2 space-y-1 font-sans text-xs transition-colors duration-200 ${
          isDark ? 'bg-[#0d1117]' : 'bg-white'
        }`}
      >
        {/* Root Node: Project Name -> Links to Project Dashboard */}
        <div
          onClick={handleRootClick}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
            isRootActive
              ? isDark
                ? 'bg-[#1f3a5f] text-blue-200 font-semibold'
                : 'bg-[#e0efff] text-blue-900 font-semibold'
              : isDark
                ? 'hover:bg-[#1f242c] text-slate-200'
                : 'hover:bg-slate-100 text-slate-800'
          }`}
          title={`${currentProject?.name || 'Project'} (Dashboard)`}
        >
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              toggleFolder('root');
            }}
            className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] rounded-2xs font-mono shrink-0 ${
              isDark
                ? 'border-slate-600 bg-[#161b22] text-slate-300 hover:bg-[#21262d]'
                : 'border-slate-400 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {expandedFolders.has('root') ? (
              <Minus className="w-2.5 h-2.5" />
            ) : (
              <Plus className="w-2.5 h-2.5" />
            )}
          </button>

          <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate font-semibold flex-1">{currentProject?.name || 'Project'}</span>
          <span className="text-[10px] opacity-60 font-mono shrink-0">({totalItemCount})</span>
        </div>

        {/* Tree Items when Root Expanded */}
        {expandedFolders.has('root') && (
          <div
            className={`pl-2 space-y-0.5 border-l ml-2 ${isDark ? 'border-[#30363d]' : 'border-slate-200'}`}
          >
            {isLoading ? (
              <div className="py-4 text-center text-slate-400 text-xs italic">
                Loading explorer tree...
              </div>
            ) : nodes.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs italic">
                No folders or items in this project.
              </div>
            ) : (
              nodes.map(node => renderTreeNode(node, 0))
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom Real Metrics & Filter Pills Panel */}
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
            <span
              className={`flex items-center gap-1 font-semibold ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Project Filters</span>
            </span>
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
              Types
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
              Status
            </button>
          </div>
        </div>

        {/* Real Live Dev Data Pills */}
        <div className="flex-1 p-2.5 overflow-y-auto flex flex-wrap gap-1.5 items-center content-start">
          {tagTab === 'cloud' ? (
            /* By Item Type */
            Object.keys(typeCounts).length > 0 ? (
              Object.entries(typeCounts).map(([typeKey, count]) => {
                const isActive = itemTypeFilter === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setItemTypeFilter(isActive ? '' : typeKey)}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : isDark
                          ? 'bg-[#21262d] border-[#30363d] text-slate-300 hover:border-blue-500 hover:text-blue-400'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-2xs'
                    }`}
                    title={`Filter items by type ${typeKey}`}
                  >
                    <span>{typeKey}</span>
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isActive
                          ? 'bg-blue-800 text-blue-100'
                          : isDark
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-[11px] text-slate-400 italic">No items recorded yet</span>
            )
          ) : /* By Status */
          Object.keys(statusCounts).length > 0 ? (
            Object.entries(statusCounts).map(([status, count]) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(isActive ? '' : status)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : isDark
                        ? 'bg-[#21262d] border-[#30363d] text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 shadow-2xs'
                  }`}
                  title={`Filter items by status ${status}`}
                >
                  <span>{status}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-100'
                        : isDark
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-[11px] text-slate-400 italic">No statuses recorded yet</span>
          )}
        </div>
      </div>
    </div>
  );
};
