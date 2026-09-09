import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useThemeStore } from '../../../stores/theme.store';

export interface ColumnDefinition {
  id: string;
  label: string;
  category: 'common' | 'requirement' | 'use_case' | 'test_case' | 'defect' | 'change_request';
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDefinition[] = [
  { id: 'commentsCount', label: '# of Comments', category: 'common', defaultVisible: true },
  { id: 'downstreamCount', label: '# of Downstream...', category: 'common', defaultVisible: false },
  { id: 'upstreamCount', label: '# of Upstream R...', category: 'common', defaultVisible: false },
  { id: 'actors', label: 'Actors', category: 'use_case', defaultVisible: false },
  { id: 'apiId', label: 'API ID', category: 'common', defaultVisible: false },
  { id: 'assigned', label: 'Assigned', category: 'common', defaultVisible: false },
  { id: 'assignee', label: 'Assignee', category: 'common', defaultVisible: true },
  { id: 'bugStatus', label: 'Bug Status', category: 'defect', defaultVisible: false },
  { id: 'businessOwner', label: 'Business Owner', category: 'requirement', defaultVisible: false },
  { id: 'connectedUsers', label: 'Connected Users', category: 'common', defaultVisible: true },
  { id: 'createdBy', label: 'Created By', category: 'common', defaultVisible: false },
  { id: 'createdDate', label: 'Created Date', category: 'common', defaultVisible: true },
  { id: 'description', label: 'Description', category: 'common', defaultVisible: false },
  { id: 'estimate', label: 'Estimate', category: 'use_case', defaultVisible: false },
  { id: 'foundBy', label: 'Found By', category: 'defect', defaultVisible: false },
  { id: 'globalId', label: 'Global ID', category: 'common', defaultVisible: false },
  { id: 'heading', label: 'Heading', category: 'common', defaultVisible: false },
  { id: 'itemKey', label: 'ID', category: 'common', defaultVisible: true },
  { id: 'name', label: 'Name', category: 'common', defaultVisible: true },
  { id: 'priority', label: 'Priority', category: 'common', defaultVisible: true },
  { id: 'status', label: 'Status', category: 'common', defaultVisible: true },
  { id: 'version', label: 'Version', category: 'common', defaultVisible: false },
  { id: 'updatedAt', label: 'Updated Date', category: 'common', defaultVisible: false },
];

interface CustomizeColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (colId: string) => void;
  onSelectAll?: () => void;
}

export const CustomizeColumnsModal: React.FC<CustomizeColumnsModalProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onToggleColumn,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Fields' },
    { id: 'common', label: 'Common Fields' },
    { id: 'requirement', label: 'Business Requirement' },
    { id: 'change_request', label: 'Change Request' },
    { id: 'defect', label: 'Defect' },
    { id: 'functional', label: 'Functional Requirement' },
    { id: 'test_case', label: 'Test Case' },
    { id: 'use_case', label: 'Use Case' },
  ];

  const selectedCount = Object.values(visibleColumns).filter(Boolean).length;

  const filteredColumns = ALL_COLUMNS.filter(col => {
    if (filterMode === 'selected' && !visibleColumns[col.id]) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'common') return col.category === 'common';
    if (selectedCategory === 'requirement')
      return col.category === 'requirement' || col.category === 'common';
    if (selectedCategory === 'use_case')
      return col.category === 'use_case' || col.category === 'common';
    if (selectedCategory === 'test_case')
      return col.category === 'test_case' || col.category === 'common';
    if (selectedCategory === 'defect')
      return col.category === 'defect' || col.category === 'common';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] select-none font-sans">
      <div
        className={`w-[780px] max-w-[95vw] rounded-lg shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors ${
          isDark
            ? 'bg-[#161b22] border-[#30363d] text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Modal Top Header (Matching Image 5) */}
        <div
          className={`h-11 px-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#f8fafc] border-slate-200'
          }`}
        >
          <h3 className="text-sm font-bold">All Fields</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={filterMode === 'all' ? (isDark ? 'secondary' : 'secondary') : 'outline'}
              size="sm"
              onClick={() => setFilterMode('all')}
              className="text-xs font-semibold"
            >
              All
            </Button>
            <Button
              type="button"
              variant={filterMode === 'selected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode(filterMode === 'selected' ? 'all' : 'selected')}
              className="text-xs font-semibold"
            >
              Selected ({selectedCount})
            </Button>
            <button
              type="button"
              onClick={onClose}
              className={`p-1 rounded transition-colors ml-1 ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left category sidebar + Right fields grid */}
        <div className="flex h-[420px]">
          {/* Left Category Sidebar */}
          <div
            className={`w-52 border-r flex flex-col py-1 text-xs transition-colors ${
              isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f1f5f9] border-slate-200'
            }`}
          >
            {categories.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-left px-4 py-2.5 font-medium transition-colors border-l-4 ${
                    isActive
                      ? isDark
                        ? 'bg-[#21262d] text-white border-[#00a3e0] font-bold'
                        : 'bg-white text-slate-900 border-[#00a3e0] font-bold shadow-xs'
                      : isDark
                        ? 'border-transparent text-slate-400 hover:bg-[#282e38] hover:text-slate-200'
                        : 'border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Right Area: Grid of Checkboxes matching Image 5 */}
          <div
            className={`flex-1 p-5 overflow-y-auto transition-colors ${
              isDark ? 'bg-[#0d1117]' : 'bg-white'
            }`}
          >
            <h4
              className={`text-sm font-semibold mb-4 pb-1 border-b ${
                isDark ? 'text-slate-200 border-[#30363d]' : 'text-slate-700 border-slate-100'
              }`}
            >
              {categories.find(c => c.id === selectedCategory)?.label || 'All Fields'}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredColumns.map(col => {
                const isChecked = !!visibleColumns[col.id];
                return (
                  <label
                    key={col.id}
                    onClick={() => onToggleColumn(col.id)}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-all ${
                      isChecked
                        ? isDark
                          ? 'bg-[#1f3a5f] border-blue-500/60 text-white font-medium shadow-2xs'
                          : 'bg-slate-50 border-slate-300 text-slate-900 font-medium shadow-2xs'
                        : isDark
                          ? 'bg-[#161b22] border-[#30363d] text-slate-300 hover:bg-[#21262d] hover:border-slate-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span className="truncate">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`h-11 px-4 border-t flex items-center justify-between text-xs transition-colors ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#f8fafc] border-slate-200'
          }`}
        >
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Click on fields to toggle columns visible in project list view.
          </span>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="bg-[#203a6b] hover:bg-[#1a2f55] text-white font-semibold"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
