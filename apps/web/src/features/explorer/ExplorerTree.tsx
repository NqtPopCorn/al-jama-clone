import React, { useState, useMemo } from 'react';
import { ExplorerNode, LicenseType } from '@aljama/shared';
import { useProjectStore } from '../../stores/project.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
  CheckSquare,
  FileCode,
  Search,
  Lock,
  FolderTree,
} from 'lucide-react';

interface ExplorerTreeProps {
  nodes: ExplorerNode[];
  isLoading?: boolean;
}

export const ExplorerTree: React.FC<ExplorerTreeProps> = ({ nodes, isLoading }) => {
  const { user } = useAuthStore();
  const { selectedFolderId, selectedItemId, setSelectedFolderId, setSelectedItemId } =
    useProjectStore();

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => {
    // Expand top-level folders by default
    const set = new Set<string>();
    nodes.forEach((n) => {
      if (n.type === 'folder') set.add(n.id);
    });
    return set;
  });

  const [filterText, setFilterText] = useState('');

  // QT-08 Check: Reviewer Limited accounts cannot access Explorer
  if (user?.licenseType === LicenseType.REVIEWER_LIMITED) {
    return (
      <div className="p-6 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-xl m-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-semibold text-slate-200">Explorer Restricted (QT-08)</h4>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Your account has a <strong>Reviewer Limited</strong> license. Direct project explorer access is disabled. You may only review assigned items via Review Center.
        </p>
      </div>
    );
  }

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getItemIcon = (key?: string) => {
    switch (key) {
      case 'REQ':
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'UC':
        return <Layers className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'TC':
        return <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const renderNode = (node: ExplorerNode, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolderIds.has(node.id);
    const isSelected = isFolder
      ? selectedFolderId === node.id
      : selectedItemId === node.id;

    // Filter check
    const matchesFilter =
      !filterText ||
      node.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (node.key && node.key.toLowerCase().includes(filterText.toLowerCase()));

    return (
      <div key={node.id} className="select-none text-xs">
        <div
          onClick={() => {
            if (isFolder) {
              setSelectedFolderId(selectedFolderId === node.id ? null : node.id);
            } else {
              setSelectedItemId(selectedItemId === node.id ? null : node.id);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center gap-1.5 py-1.5 pr-3 cursor-pointer rounded-md transition-colors my-0.5 ${
            isSelected
              ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
              : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
          }`}
        >
          {isFolder ? (
            <>
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-200"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-4 shrink-0" />
              {getItemIcon(node.itemTypeKey)}
            </>
          )}

          {/* Node label */}
          <span className="truncate flex-1">
            {node.key && (
              <span className="font-mono text-[10px] text-slate-500 mr-1.5 group-hover:text-slate-400">
                {node.key}
              </span>
            )}
            {node.name}
          </span>
        </div>

        {/* Children render */}
        {isFolder && isExpanded && node.children && node.children.length > 0 && (
          <div className="border-l border-slate-800/80 ml-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      {/* Search within explorer */}
      <div className="p-2.5 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search hierarchy..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            Loading Explorer...
          </div>
        ) : nodes.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <FolderTree className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
            No folders or items found in project.
          </div>
        ) : (
          nodes.map((node) => renderNode(node, 0))
        )}
      </div>

      {/* Scope reset button if a folder is selected */}
      {selectedFolderId && (
        <div className="p-2 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Folder filtered</span>
          <button
            onClick={() => setSelectedFolderId(null)}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
};
