import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ExplorerNode } from '@aljama/shared';
import {
  X,
  Search,
  Folder,
  ChevronRight,
  ChevronDown,
  Target,
  FileText,
  Layers,
  CheckCircle2,
  Bug,
  Plus,
  FolderTree,
} from 'lucide-react';
import { ReviewWizardItemInfo } from './StartReviewWizard';

interface ProjectItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  alreadySelectedItemIds?: string[];
  onSelectItems: (items: ReviewWizardItemInfo[]) => void;
}

// Fallback sample tree if project has no tree nodes or while testing
const SAMPLE_PROJECT_TREE: ExplorerNode[] = [
  {
    id: 'folder-sys',
    name: 'System Requirements Specification (SRS)',
    type: 'folder',
    orderIndex: 1,
    children: [
      {
        id: 'item-txt-3',
        key: 'Rev-TXT-3',
        name: 'Scope and Purpose',
        type: 'item',
        itemTypeKey: 'TXT',
        status: 'In Review',
        orderIndex: 1,
      },
      {
        id: 'item-txt-4',
        key: 'Rev-TXT-4',
        name: 'Definitions and Acronyms',
        type: 'item',
        itemTypeKey: 'TXT',
        status: 'In Review',
        orderIndex: 2,
      },
      {
        id: 'item-txt-5',
        key: 'Rev-TXT-5',
        name: 'Applicable Regulations',
        type: 'item',
        itemTypeKey: 'TXT',
        status: 'In Review',
        orderIndex: 3,
      },
      {
        id: 'item-txt-6',
        key: 'Rev-TXT-6',
        name: 'Safety Standards',
        type: 'item',
        itemTypeKey: 'TXT',
        status: 'In Review',
        orderIndex: 4,
      },
      {
        id: 'item-sr-1',
        key: 'Rev-SR-1',
        name: 'Emergency Stop Protocol',
        type: 'item',
        itemTypeKey: 'REQ',
        status: 'In Review',
        orderIndex: 5,
      },
      {
        id: 'item-sr-2',
        key: 'Rev-SR-2',
        name: 'Bolus Delivery Precision',
        type: 'item',
        itemTypeKey: 'REQ',
        status: 'In Review',
        orderIndex: 6,
      },
      {
        id: 'item-sr-3',
        key: 'Rev-SR-3',
        name: 'Wireless Telemetry Encryption',
        type: 'item',
        itemTypeKey: 'REQ',
        status: 'In Review',
        orderIndex: 7,
      },
      {
        id: 'item-sr-4',
        key: 'Rev-SR-4',
        name: 'Battery Backup Duration',
        type: 'item',
        itemTypeKey: 'REQ',
        status: 'Accepted',
        orderIndex: 8,
      },
      {
        id: 'item-sr-5',
        key: 'Rev-SR-5',
        name: 'Occlusion Pressure Threshold',
        type: 'item',
        itemTypeKey: 'REQ',
        status: 'Accepted',
        orderIndex: 9,
      },
      {
        id: 'item-sr-7',
        key: 'Rev-SR-7',
        name: 'Air-in-line Bubble Detection',
        type: 'item',
        itemTypeKey: 'REQ',
        status: 'In Review',
        orderIndex: 10,
      },
    ],
  },
  {
    id: 'folder-uc',
    name: 'Use Cases & Clinical Workflows',
    type: 'folder',
    orderIndex: 2,
    children: [
      {
        id: 'item-uc-1',
        key: 'Rev-UC-1',
        name: 'Clinician Program Infusion Rate',
        type: 'item',
        itemTypeKey: 'UC',
        status: 'Accepted',
        orderIndex: 1,
      },
      {
        id: 'item-uc-2',
        key: 'Rev-UC-2',
        name: 'Emergency Bolus Delivery Manual Override',
        type: 'item',
        itemTypeKey: 'UC',
        status: 'In Review',
        orderIndex: 2,
      },
      {
        id: 'item-uc-3',
        key: 'Rev-UC-3',
        name: 'Occlusion Alarm and Auto-Pause Workflow',
        type: 'item',
        itemTypeKey: 'UC',
        status: 'In Review',
        orderIndex: 3,
      },
    ],
  },
  {
    id: 'folder-tc',
    name: 'Verification Test Cases',
    type: 'folder',
    orderIndex: 3,
    children: [
      {
        id: 'item-tc-1',
        key: 'Rev-TC-1',
        name: 'Test Battery Cutoff Response Time',
        type: 'item',
        itemTypeKey: 'TC',
        status: 'Draft',
        orderIndex: 1,
      },
      {
        id: 'item-tc-2',
        key: 'Rev-TC-2',
        name: 'Verify Air Bubble Ultrasonic Sensor Accuracy',
        type: 'item',
        itemTypeKey: 'TC',
        status: 'Draft',
        orderIndex: 2,
      },
    ],
  },
];

export const ProjectItemPickerModal: React.FC<ProjectItemPickerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  alreadySelectedItemIds = [],
  onSelectItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Fetch project explorer tree
  const { data: treeData, isLoading } = useQuery({
    queryKey: ['explorer-tree', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get(`/projects/${projectId}/explorer-tree`);
      return res.data.data as ExplorerNode[];
    },
    enabled: !!projectId && isOpen,
  });

  const nodes = useMemo(() => {
    if (treeData && treeData.length > 0) return treeData;
    return SAMPLE_PROJECT_TREE;
  }, [treeData]);

  // Expand all top-level folders on mount/open
  useEffect(() => {
    if (isOpen) {
      const topIds = new Set<string>();
      nodes.forEach(n => {
        if (n.type === 'folder') topIds.add(n.id);
      });
      setExpandedFolderIds(topIds);
      // Initialize selected IDs with already selected items
      setSelectedItemIds(new Set(alreadySelectedItemIds));
    }
  }, [isOpen, nodes, alreadySelectedItemIds]);

  // Collect all item nodes into a map for fast lookup
  const allItemsMap = useMemo(() => {
    const map = new Map<string, ExplorerNode>();
    const walk = (nodeList: ExplorerNode[]) => {
      for (const node of nodeList) {
        if (node.type === 'item') {
          map.set(node.id, node);
        }
        if (node.children && node.children.length > 0) {
          walk(node.children);
        }
      }
    };
    walk(nodes);
    return map;
  }, [nodes]);

  // Helper to gather all item descendants of a folder node
  const getDescendantItemIds = (node: ExplorerNode): string[] => {
    const ids: string[] = [];
    const walk = (n: ExplorerNode) => {
      if (n.type === 'item') {
        ids.push(n.id);
      }
      if (n.children && n.children.length > 0) {
        n.children.forEach(walk);
      }
    };
    walk(node);
    return ids;
  };

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleItemSelect = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleFolderSelect = (folderNode: ExplorerNode) => {
    const childItemIds = getDescendantItemIds(folderNode);
    if (childItemIds.length === 0) return;

    // If all are already selected, deselect all; otherwise select all
    const allSelected = childItemIds.every(id => selectedItemIds.has(id));
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        childItemIds.forEach(id => next.delete(id));
      } else {
        childItemIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set<string>();
    allItemsMap.forEach((_, id) => allIds.add(id));
    setSelectedItemIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedItemIds(new Set());
  };

  const handleConfirm = () => {
    const selectedList: ReviewWizardItemInfo[] = [];
    selectedItemIds.forEach(id => {
      const node = allItemsMap.get(id);
      if (node) {
        selectedList.push({
          id: node.id,
          key: node.key || 'ITEM',
          name: node.name,
          itemTypeKey: node.itemTypeKey || 'REQ',
          status: node.status || 'In Review',
          currentVersion: 1,
          priority: node.priority || 'Medium',
        });
      }
    });

    onSelectItems(selectedList);
    onClose();
  };

  const renderItemTypeIcon = (typeKey?: string) => {
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

  const renderTreeNode = (node: ExplorerNode, depth = 0): React.ReactNode => {
    const isFolder = node.type === 'folder';

    if (isFolder) {
      const isExpanded = expandedFolderIds.has(node.id);
      const childItemIds = getDescendantItemIds(node);
      const selectedChildCount = childItemIds.filter(id => selectedItemIds.has(id)).length;
      const isAllChildrenSelected =
        childItemIds.length > 0 && selectedChildCount === childItemIds.length;
      const isPartiallySelected =
        selectedChildCount > 0 && selectedChildCount < childItemIds.length;

      // Filter check
      const matchesSearch =
        !searchQuery.trim() ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        childItemIds.some(id => {
          const item = allItemsMap.get(id);
          return (
            item &&
            (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.key && item.key.toLowerCase().includes(searchQuery.toLowerCase())))
          );
        });

      if (!matchesSearch) return null;

      return (
        <div key={node.id} className="space-y-0.5">
          <div
            className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-100 cursor-pointer text-xs group"
            style={{ paddingLeft: `${depth * 16 + 6}px` }}
          >
            {/* Expand / Collapse Button */}
            <button
              type="button"
              onClick={e => toggleFolderExpand(node.id, e)}
              className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-800 shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Folder Checkbox */}
            <input
              type="checkbox"
              checked={isAllChildrenSelected}
              ref={el => {
                if (el) el.indeterminate = isPartiallySelected;
              }}
              onChange={() => toggleFolderSelect(node)}
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
            />

            <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span
              onClick={e => toggleFolderExpand(node.id, e)}
              className="font-semibold text-slate-800 truncate flex-1"
            >
              {node.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              ({selectedChildCount}/{childItemIds.length})
            </span>
          </div>

          {/* Children */}
          {isExpanded && node.children && (
            <div className="space-y-0.5">
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      // Item node
      const isSelected = selectedItemIds.has(node.id);

      const matchesSearch =
        !searchQuery.trim() ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.key && node.key.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return null;

      return (
        <div
          key={node.id}
          onClick={() => toggleItemSelect(node.id)}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer text-xs transition-colors ${
            isSelected
              ? 'bg-blue-50/70 text-blue-900 font-medium'
              : 'hover:bg-slate-50 text-slate-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 6}px` }}
        >
          {/* Spacer aligning with folder expand button */}
          <span className="w-4 shrink-0" />

          {/* Item Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleItemSelect(node.id)}
            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
          />

          {renderItemTypeIcon(node.itemTypeKey)}

          <span className="font-mono text-[10px] font-bold text-blue-600 shrink-0">{node.key}</span>
          <span className="truncate flex-1">{node.name}</span>

          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 shrink-0">
            {node.status || 'In Review'}
          </span>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150"
      style={{ zIndex: 100 }}
    >
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col max-h-[85vh] overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Select Items from Project Hierarchy
              </h3>
              <p className="text-[11px] text-slate-500">
                {projectName || 'Project'} • Select items or sets to include in this review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Select/Deselect All */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search items by ID or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-1.5 pr-8 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            >
              Deselect all
            </button>
          </div>
        </div>

        {/* Modal Tree Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-sans text-xs min-h-[280px]">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              Loading project tree...
            </div>
          ) : (
            nodes.map(node => renderTreeNode(node, 0))
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200 text-xs">
          <span className="font-semibold text-slate-700">
            {selectedItemIds.size} {selectedItemIds.size === 1 ? 'item' : 'items'} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-1.5 font-semibold text-white bg-[#203a6b] hover:bg-[#162747] rounded shadow transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                Add {selectedItemIds.size} {selectedItemIds.size === 1 ? 'item' : 'items'} to Review
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
