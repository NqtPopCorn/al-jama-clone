import React, { useState, useEffect, useMemo } from 'react';
import { ExplorerNode, LicenseType } from '@aljama/shared';
import { useProjectStore } from '../../stores/project.store';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  Folder,
  FolderOpen,
  Plus,
  Minus,
  Settings,
  User,
  Filter,
  Bookmark,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  CheckCircle2,
  Bug,
  Target,
  Tag,
  Lock,
  RotateCcw,
  HelpCircle,
  Edit2,
  Copy,
  Trash2,
  FolderTree,
  FileCheck,
  ExternalLink,
  GitBranch,
} from 'lucide-react';
import { ReviewWizardItemInfo } from '../review/components/StartReviewWizard';

const READY_FOR_REVIEW_FILTER_ITEMS: ReviewWizardItemInfo[] = [
  { id: 'item-txt-3', key: 'Rev-TXT-3', name: 'Scope and Purpose', itemTypeKey: 'TXT', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-txt-4', key: 'Rev-TXT-4', name: 'Definitions and Acronyms', itemTypeKey: 'TXT', status: 'In Review', currentVersion: 1, priority: 'Medium' },
  { id: 'item-txt-5', key: 'Rev-TXT-5', name: 'Applicable Regulations', itemTypeKey: 'TXT', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-txt-6', key: 'Rev-TXT-6', name: 'Safety Standards', itemTypeKey: 'TXT', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-fld-3', key: 'Rev-FLD-3', name: 'Core Delivery Architecture', itemTypeKey: 'SET', status: 'In Review', currentVersion: 1, priority: 'Medium' },
  { id: 'item-sr-2', key: 'Rev-SR-2', name: 'Bolus Delivery Precision', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-sr-5', key: 'Rev-SR-5', name: 'Occlusion Pressure Threshold', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-sr-4', key: 'Rev-SR-4', name: 'Battery Backup Duration', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1, priority: 'Medium' },
  { id: 'item-fld-4', key: 'Rev-FLD-4', name: 'Safety System Sensors', itemTypeKey: 'SET', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-sr-1', key: 'Rev-SR-1', name: 'Emergency Stop Protocol', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-sr-7', key: 'Rev-SR-7', name: 'Air-in-line Bubble Detection', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1, priority: 'High' },
  { id: 'item-fld-5', key: 'Rev-FLD-5', name: 'Telemetry Interface', itemTypeKey: 'SET', status: 'In Review', currentVersion: 1, priority: 'Low' },
  { id: 'item-sr-3', key: 'Rev-SR-3', name: 'Wireless Telemetry Encryption', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1, priority: 'High' },
];

export interface FilterItem {
  id: string;
  name: string;
  isBookmarked: boolean;
  itemsCount: number;
  items: ReviewWizardItemInfo[];
}

const DEFAULT_FILTERS: FilterItem[] = [
  {
    id: 'filter-missing-downstream',
    name: '*Requirements Missing Downstream Item',
    isBookmarked: true,
    itemsCount: 5,
    items: [
      { id: 'item-sr-1', key: 'Rev-SR-1', name: 'Emergency Stop Protocol', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1 },
      { id: 'item-sr-3', key: 'Rev-SR-3', name: 'Wireless Telemetry Encryption', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1 },
      { id: 'item-sr-7', key: 'Rev-SR-7', name: 'Air-in-line Bubble Detection', itemTypeKey: 'REQ', status: 'In Review', currentVersion: 1 },
      { id: 'item-txt-5', key: 'Rev-TXT-5', name: 'Applicable Regulations', itemTypeKey: 'TXT', status: 'In Review', currentVersion: 1 },
      { id: 'item-fld-3', key: 'Rev-FLD-3', name: 'Core Delivery Architecture', itemTypeKey: 'SET', status: 'In Review', currentVersion: 1 },
    ],
  },
  {
    id: 'filter-accepted',
    name: 'System Requirements Accepted',
    isBookmarked: true,
    itemsCount: 4,
    items: [
      { id: 'item-sr-4', key: 'Rev-SR-4', name: 'Battery Backup Duration', itemTypeKey: 'REQ', status: 'Accepted', currentVersion: 1 },
      { id: 'item-sr-5', key: 'Rev-SR-5', name: 'Occlusion Pressure Threshold', itemTypeKey: 'REQ', status: 'Accepted', currentVersion: 1 },
      { id: 'item-txt-4', key: 'Rev-TXT-4', name: 'Definitions and Acronyms', itemTypeKey: 'TXT', status: 'Accepted', currentVersion: 1 },
      { id: 'item-fld-4', key: 'Rev-FLD-4', name: 'Safety System Sensors', itemTypeKey: 'SET', status: 'Accepted', currentVersion: 1 },
    ],
  },
  {
    id: 'filter-in-process',
    name: 'System Requirements In Process',
    isBookmarked: true,
    itemsCount: 6,
    items: [
      { id: 'item-sr-2', key: 'Rev-SR-2', name: 'Bolus Delivery Precision', itemTypeKey: 'REQ', status: 'In Process', currentVersion: 1 },
      { id: 'item-sr-3', key: 'Rev-SR-3', name: 'Wireless Telemetry Encryption', itemTypeKey: 'REQ', status: 'In Process', currentVersion: 1 },
      { id: 'item-txt-3', key: 'Rev-TXT-3', name: 'Scope and Purpose', itemTypeKey: 'TXT', status: 'In Process', currentVersion: 1 },
      { id: 'item-txt-6', key: 'Rev-TXT-6', name: 'Safety Standards', itemTypeKey: 'TXT', status: 'In Process', currentVersion: 1 },
      { id: 'item-fld-5', key: 'Rev-FLD-5', name: 'Telemetry Interface', itemTypeKey: 'SET', status: 'In Process', currentVersion: 1 },
      { id: 'item-fld-3', key: 'Rev-FLD-3', name: 'Core Delivery Architecture', itemTypeKey: 'SET', status: 'In Process', currentVersion: 1 },
    ],
  },
  {
    id: 'filter-ready-for-review',
    name: 'System Requirements Ready for Review',
    isBookmarked: true,
    itemsCount: 13,
    items: READY_FOR_REVIEW_FILTER_ITEMS,
  },
  {
    id: 'filter-unassigned-defects',
    name: 'All Unassigned Defects',
    isBookmarked: false,
    itemsCount: 3,
    items: [
      { id: 'def-1', key: 'DEF-101', name: 'Bolus valve leakage under extreme pressure', itemTypeKey: 'DEFECT', status: 'Open', currentVersion: 1 },
      { id: 'def-2', key: 'DEF-102', name: 'Bluetooth reconnection timeout', itemTypeKey: 'DEFECT', status: 'Open', currentVersion: 1 },
      { id: 'def-3', key: 'DEF-103', name: 'Screen flicker at low battery state', itemTypeKey: 'DEFECT', status: 'Open', currentVersion: 1 },
    ],
  },
];

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: 'filter' | 'item' | 'folder';
  data: {
    id: string;
    key?: string;
    name: string;
    itemTypeKey?: string;
    isBookmarked?: boolean;
    items?: ReviewWizardItemInfo[];
  };
}

interface ExplorerSidebarProps {
  nodes?: ExplorerNode[];
  isLoading?: boolean;
  activePerspective?: string;
  onSelectRootDashboard?: () => void;
  onSelectFolder?: (folderId: string | null) => void;
  onSelectItem?: (itemId: string, key: string, name: string) => void;
  onOpenCreateItem?: () => void;
  onSendForReview?: (config: {
    reviewName: string;
    sourceFilterName?: string;
    items: ReviewWizardItemInfo[];
  }) => void;
}

export const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({
  nodes = [],
  isLoading,
  activePerspective,
  onSelectRootDashboard,
  onSelectFolder,
  onSelectItem,
  onOpenCreateItem,
  onSendForReview,
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

  const [activeTab, setActiveTab] = useState<'explorer' | 'filter' | 'bookmarks' | 'views'>('explorer');
  const [tagTab, setTagTab] = useState<'cloud' | 'list'>('cloud');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Filters tab state
  const [filterViewMode, setFilterViewMode] = useState<'bookmarks' | 'all'>('bookmarks');
  const [isBookmarkedSectionOpen, setIsBookmarkedSectionOpen] = useState(true);
  const [filtersList, setFiltersList] = useState<FilterItem[]>(DEFAULT_FILTERS);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'filter',
    data: { id: '', name: '' },
  });

  // Close context menu on external click or escape
  useEffect(() => {
    const handleOutsideClick = () => {
      if (contextMenu.isOpen) {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.isOpen]);

  // Automatically expand top-level folders when nodes load
  useEffect(() => {
    if (nodes.length > 0) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add('root');
        nodes.forEach((n) => {
          if (n.type === 'folder') next.add(n.id);
        });
        return next;
      });
    }
  }, [nodes]);

  // Helper to gather descendant items
  const collectDescendantItems = (node: ExplorerNode): ReviewWizardItemInfo[] => {
    const result: ReviewWizardItemInfo[] = [];
    const walk = (n: ExplorerNode) => {
      if (n.type === 'item') {
        result.push({
          id: n.id,
          key: n.key || 'ITEM',
          name: n.name,
          itemTypeKey: n.itemTypeKey,
          status: n.status || 'Draft',
          currentVersion: 1,
          priority: n.priority || 'Medium',
        });
      }
      if (n.children && n.children.length > 0) {
        n.children.forEach(walk);
      }
    };
    walk(node);
    return result;
  };

  // Context menu openers
  const handleFilterContextMenu = (e: React.MouseEvent, filter: FilterItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 300),
      type: 'filter',
      data: {
        id: filter.id,
        name: filter.name,
        isBookmarked: filter.isBookmarked,
        items: filter.items,
      },
    });
  };

  const handleItemContextMenu = (e: React.MouseEvent, node: ExplorerNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 250),
      type: 'item',
      data: {
        id: node.id,
        key: node.key,
        name: node.name,
        itemTypeKey: node.itemTypeKey,
        items: [
          {
            id: node.id,
            key: node.key || 'ITEM',
            name: node.name,
            itemTypeKey: node.itemTypeKey,
            status: node.status || 'Draft',
            currentVersion: 1,
          },
        ],
      },
    });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, node: ExplorerNode) => {
    e.preventDefault();
    e.stopPropagation();
    const descendants = collectDescendantItems(node);
    setContextMenu({
      isOpen: true,
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 250),
      type: 'folder',
      data: {
        id: node.id,
        name: node.name,
        items: descendants,
      },
    });
  };

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
            onContextMenu={(e) => handleFolderContextMenu(e, node)}
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
                onClick={(e) => {
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
              {node.children!.map((child) => renderTreeNode(child, depth + 1))}
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
          onContextMenu={(e) => handleItemContextMenu(e, node)}
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

  const displayedFilters = useMemo(() => {
    if (filterViewMode === 'bookmarks') {
      return filtersList.filter((f) => f.isBookmarked);
    }
    return filtersList;
  }, [filtersList, filterViewMode]);

  return (
    <div
      className={`h-full flex flex-col border-r text-xs select-none transition-colors duration-200 relative ${
        isDark
          ? 'bg-[#161b22] border-[#30363d] text-slate-200'
          : 'bg-[#f5f6f8] border-slate-300 text-slate-800'
      }`}
    >
      {/* 1. Top Tab Strip (Explorer | Filters | Bookmarks | Views) matching Jama Connect screenshots */}
      <div
        className={`h-8 border-b flex items-center px-1 gap-1 transition-colors duration-200 ${
          isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#e4e7eb] border-slate-300'
        }`}
      >
        {/* Tab 1: Explorer */}
        <button
          type="button"
          onClick={() => setActiveTab('explorer')}
          className={`h-6 px-2 rounded-t text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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

        {/* Tab 2: Filters */}
        <button
          type="button"
          onClick={() => setActiveTab('filter')}
          className={`h-6 px-2 rounded-t text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'filter'
              ? isDark
                ? 'bg-[#161b22] text-blue-400 border-t border-l border-r border-[#30363d] shadow-2xs'
                : 'bg-white text-blue-600 border-t border-l border-r border-slate-300 shadow-2xs'
              : isDark
              ? 'text-slate-400 hover:bg-[#282e38] hover:text-slate-200'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="Filters"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>

        {/* Tab 3: Bookmarks */}
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

        {/* Tab 4: Views */}
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

      {/* ========================================================================= */}
      {/* TAB CONTENT: EXPLORER TAB                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'explorer' && (
        <>
          {/* Sub-Toolbar: + Add ▼ and Tools Gear */}
          <div
            className={`h-8 px-2 border-b flex items-center justify-between transition-colors duration-200 ${
              isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                if (onOpenCreateItem) onOpenCreateItem();
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

          {/* Folder Tree Hierarchy */}
          <div
            className={`flex-1 overflow-y-auto p-2 space-y-1 font-sans text-xs transition-colors duration-200 ${
              isDark ? 'bg-[#0d1117]' : 'bg-white'
            }`}
          >
            {/* Root Node: Project Name */}
            <div
              onClick={handleRootClick}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Collect all project items
                const allItems: ReviewWizardItemInfo[] = [];
                nodes.forEach((n) => allItems.push(...collectDescendantItems(n)));
                setContextMenu({
                  isOpen: true,
                  x: Math.min(e.clientX, window.innerWidth - 240),
                  y: Math.min(e.clientY, window.innerHeight - 250),
                  type: 'folder',
                  data: {
                    id: 'root',
                    name: currentProject?.name || 'Project',
                    items: allItems,
                  },
                });
              }}
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
                onClick={(e) => {
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
              <span className="truncate font-semibold flex-1">
                {currentProject?.name || 'Project'}
              </span>
              <span className="text-[10px] opacity-60 font-mono shrink-0">({totalItemCount})</span>
            </div>

            {/* Tree Items when Root Expanded */}
            {expandedFolders.has('root') && (
              <div
                className={`pl-2 space-y-0.5 border-l ml-2 ${
                  isDark ? 'border-[#30363d]' : 'border-slate-200'
                }`}
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
                  nodes.map((node) => renderTreeNode(node, 0))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: FILTERS TAB (Khớp ảnh tham khảo)                             */}
      {/* ========================================================================= */}
      {activeTab === 'filter' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white text-slate-800">
          {/* Sub-toolbar: + Add filter & action icons */}
          <div className="h-8 px-2 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <button
              type="button"
              className="text-xs font-semibold text-slate-700 hover:text-blue-700 flex items-center gap-1.5 py-0.5 px-1 rounded transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Add filter</span>
            </button>

            <div className="flex items-center gap-2 text-slate-400">
              <button
                type="button"
                className="hover:text-slate-600 p-0.5"
                title="Refresh filters list"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="hover:text-blue-600 p-0.5"
                title="Filter help documentation"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* View switcher: Bookmarks vs All */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 text-xs bg-white">
            <span className="text-slate-500 font-medium">View:</span>
            <div className="inline-flex rounded border border-slate-300 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setFilterViewMode('bookmarks')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filterViewMode === 'bookmarks'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bookmarks
              </button>
              <button
                type="button"
                onClick={() => setFilterViewMode('all')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filterViewMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Bookmarked filters collapsible section */}
          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-slate-200">
              <div
                onClick={() => setIsBookmarkedSectionOpen(!isBookmarkedSectionOpen)}
                className="px-3 py-1.5 bg-slate-100/70 hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <span>
                  {filterViewMode === 'bookmarks' ? 'Bookmarked filters' : 'All Project Filters'}
                </span>
                <span className="text-slate-400 text-[10px]">
                  {isBookmarkedSectionOpen ? '▲' : '▼'}
                </span>
              </div>

              {isBookmarkedSectionOpen && (
                <div className="divide-y divide-slate-100">
                  {displayedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      onContextMenu={(e) => handleFilterContextMenu(e, filter)}
                      className="px-3 py-1.5 flex items-center justify-between text-xs hover:bg-blue-50/60 cursor-pointer transition-colors group"
                      title="Right-click for options (Send for review, Duplicate, Edit...)"
                    >
                      <span className="text-slate-800 font-medium truncate pr-2 group-hover:text-blue-700">
                        {filter.name}
                      </span>
                      {filter.isBookmarked && (
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: BOOKMARKS / VIEWS (Placeholder fallbacks)                     */}
      {/* ========================================================================= */}
      {activeTab === 'bookmarks' && (
        <div className="flex-1 p-4 text-center text-xs text-slate-400 italic">
          Select filters or items and right-click to bookmark them.
        </div>
      )}
      {activeTab === 'views' && (
        <div className="flex-1 p-4 text-center text-xs text-slate-400 italic">
          Manage saved perspective layouts and grid configurations.
        </div>
      )}

      {/* 4. Bottom Metrics Panel */}
      <div
        className={`h-36 border-t flex flex-col transition-colors duration-200 ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f8fafc] border-slate-300'
        }`}
      >
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

        <div className="flex-1 p-2.5 overflow-y-auto flex flex-wrap gap-1.5 items-center content-start">
          {tagTab === 'cloud' ? (
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
          ) : Object.keys(statusCounts).length > 0 ? (
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

      {/* ========================================================================= */}
      {/* CONTEXT MENU POPUP (Khớp ảnh tham khảo Jama Connect)                       */}
      {/* ========================================================================= */}
      {contextMenu.isOpen && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 bg-white border border-slate-300 rounded-md shadow-2xl py-1 w-56 text-xs text-slate-800 animate-in fade-in duration-75 select-none"
        >
          {/* Menu for Filter */}
          {contextMenu.type === 'filter' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setFiltersList((prev) =>
                    prev.map((f) =>
                      f.id === contextMenu.data.id
                        ? { ...f, isBookmarked: !f.isBookmarked }
                        : f,
                    ),
                  );
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>
                  {contextMenu.data.isBookmarked
                    ? 'Remove from bookmarks'
                    : 'Bookmark filter'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>View criteria</span>
              </button>

              <button
                type="button"
                onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete</span>
              </button>

              <div className="border-t border-slate-200 my-1" />

              <button
                type="button"
                onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                <span>Apply filter to Explorer</span>
              </button>

              {/* Primary Action: Send for review */}
              <button
                type="button"
                onClick={() => {
                  onSendForReview?.({
                    reviewName: `${contextMenu.data.name}- Rolling Review`,
                    sourceFilterName: contextMenu.data.name,
                    items: contextMenu.data.items || READY_FOR_REVIEW_FILTER_ITEMS,
                  });
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full text-left px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center gap-2 border-t border-blue-100"
              >
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Send for review</span>
              </button>
            </>
          )}

          {/* Menu for Item in Explorer Tree */}
          {contextMenu.type === 'item' && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onSelectItem) {
                    onSelectItem(
                      contextMenu.data.id,
                      contextMenu.data.key || '',
                      contextMenu.data.name,
                    );
                  }
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Open Item</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (contextMenu.data.key) {
                    navigator.clipboard.writeText(contextMenu.data.key);
                  }
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Item Key</span>
              </button>

              <div className="border-t border-slate-200 my-1" />

              {/* Send this item for review */}
              <button
                type="button"
                onClick={() => {
                  onSendForReview?.({
                    reviewName: `${contextMenu.data.key}: ${contextMenu.data.name} Review`,
                    sourceFilterName: `Single Item: ${contextMenu.data.key}`,
                    items: contextMenu.data.items || [],
                  });
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full text-left px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center gap-2"
              >
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Send for review</span>
              </button>
            </>
          )}

          {/* Menu for Folder / Set in Explorer Tree */}
          {contextMenu.type === 'folder' && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.data.id !== 'root') {
                    handleFolderClick(contextMenu.data.id);
                  }
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Open Folder</span>
              </button>

              <div className="border-t border-slate-200 my-1" />

              {/* Send set for review */}
              <button
                type="button"
                onClick={() => {
                  onSendForReview?.({
                    reviewName: `Set: ${contextMenu.data.name} Review`,
                    sourceFilterName: `Folder: ${contextMenu.data.name}`,
                    items: contextMenu.data.items || [],
                  });
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full text-left px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center gap-2"
              >
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Send set for review ({contextMenu.data.items?.length || 0} items)
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
