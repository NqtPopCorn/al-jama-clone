import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { useProjectRelationshipTypes, useCreateRelationship } from '../hooks/use-traceability';
import { itemApi } from '../../item/api/item.api';
import { ItemSummary } from '@aljama/shared';
import { useThemeStore } from '../../../stores/theme.store';
import {
  ArrowRight,
  Link2,
  Search,
  AlertTriangle,
  X,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

interface RelateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentItem: {
    id: string;
    itemKey: string;
    name: string;
    itemTypeName?: string;
  };
  initialDirection?: 'upstream' | 'downstream';
}

export const RelateItemModal: React.FC<RelateItemModalProps> = ({
  isOpen,
  onClose,
  projectId,
  currentItem,
  initialDirection = 'downstream',
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const { data: relationshipTypes = [], isLoading: isLoadingTypes } =
    useProjectRelationshipTypes(projectId);
  const createMutation = useCreateRelationship(projectId, currentItem.id);

  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [direction, setDirection] = useState<'downstream' | 'upstream'>(initialDirection);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetItems, setTargetItems] = useState<ItemSummary[]>([]);
  const [selectedTargetItem, setSelectedTargetItem] = useState<ItemSummary | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default relationship type when loaded
  useEffect(() => {
    if (relationshipTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(relationshipTypes[0].id);
    }
  }, [relationshipTypes, selectedTypeId]);

  // Sync initial direction when modal opens
  useEffect(() => {
    if (isOpen) {
      setDirection(initialDirection);
    }
  }, [isOpen, initialDirection]);

  // Search items in project
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        const res = await itemApi.getProjectItems(projectId, {
          search: searchTerm.trim() || undefined,
          limit: 20,
        });
        if (isMounted) {
          const filtered = res.items.filter(i => i.id !== currentItem.id);
          setTargetItems(filtered);
        }
      } catch (err) {
        console.error('Failed to search items for relationship:', err);
      } finally {
        if (isMounted) setIsLoadingItems(false);
      }
    };

    const debounce = setTimeout(fetchItems, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [isOpen, projectId, currentItem.id, searchTerm]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedTargetItem(null);
      setSearchTerm('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedType = relationshipTypes.find(t => t.id === selectedTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetItem || !selectedTypeId) {
      setErrorMessage('Please select a target item and relationship type.');
      return;
    }

    setErrorMessage(null);

    const upstreamItemId = direction === 'downstream' ? currentItem.id : selectedTargetItem.id;
    const downstreamItemId = direction === 'downstream' ? selectedTargetItem.id : currentItem.id;

    try {
      await createMutation.mutateAsync({
        upstreamItemId,
        downstreamItemId,
        relationshipTypeId: selectedTypeId,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create relationship. It may already exist.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100 select-none">
      <div
        className={`w-full max-w-xl max-h-[90vh] rounded-md shadow-2xl border flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 ${
          isDark
            ? 'bg-[#1c2128] border-[#30363d] text-slate-200'
            : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* Modal Title Bar */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b select-none ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#333333] text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link2 className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Relate Item to <strong className="font-mono">{currentItem.itemKey}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Direction Selector Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              1. Choose Traceability Direction
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Downstream Option */}
              <div
                onClick={() => setDirection('downstream')}
                className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  direction === 'downstream'
                    ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'border-slate-200 dark:border-[#30363d] hover:border-slate-300 dark:hover:border-slate-600 opacity-70'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <ArrowDownRight className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Downstream Dependent</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  Item được chọn sẽ là <strong>Cấp dưới / Phụ thuộc</strong> (ví dụ: Test Case, Use
                  Case kiểm thử cho {currentItem.itemKey}).
                </div>
              </div>

              {/* Upstream Option */}
              <div
                onClick={() => setDirection('upstream')}
                className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  direction === 'upstream'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                    : 'border-slate-200 dark:border-[#30363d] hover:border-slate-300 dark:hover:border-slate-600 opacity-70'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <ArrowUpRight className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Upstream Parent / Source</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  Item được chọn sẽ là <strong>Cấp trên / Nguồn</strong> ({currentItem.itemKey} phụ
                  thuộc hoặc kiểm chứng cho item này).
                </div>
              </div>
            </div>
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              2. Select Relationship Type
            </label>
            <select
              value={selectedTypeId}
              onChange={e => setSelectedTypeId(e.target.value)}
              disabled={isLoadingTypes}
              className="w-full h-8 px-2 text-xs border rounded-md bg-white dark:bg-[#0d1117] border-slate-300 dark:border-[#30363d] focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {relationshipTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (
                  {t.isRequiredDefault
                    ? 'Required Link - Solid Border'
                    : 'Optional Link - Dashed Border'}
                  )
                </option>
              ))}
            </select>
          </div>

          {/* Visual Link Diagram Preview (QT-03 preview) */}
          {selectedType && (
            <div className="p-3 bg-slate-50 dark:bg-[#0d1117] rounded-md border border-slate-200 dark:border-[#30363d] text-xs">
              <div className="text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                Traceability Relationship Preview:
              </div>
              <div className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200">
                <span className="font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                  {currentItem.itemKey}
                </span>

                <div className="flex-1 flex flex-col items-center px-2">
                  <span className="text-[11px] text-slate-700 dark:text-slate-200 font-semibold">
                    {direction === 'downstream'
                      ? `is ${selectedType.inverseName}`
                      : selectedType.name}
                  </span>
                  <div
                    className={`w-full h-0.5 my-1 ${
                      selectedType.isRequiredDefault
                        ? 'border-t-2 border-solid border-blue-500'
                        : 'border-t-2 border-dashed border-slate-400'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400">
                    {direction === 'downstream' ? '↓ Downstream Link' : '↑ Upstream Link'} •{' '}
                    {selectedType.isRequiredDefault ? 'Required (Solid)' : 'Optional (Dashed)'}
                  </span>
                </div>

                <span
                  className={`font-semibold px-2 py-0.5 rounded border ${
                    direction === 'downstream'
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {selectedTargetItem?.itemKey ||
                    (direction === 'downstream'
                      ? 'Target Downstream Item'
                      : 'Target Upstream Item')}
                </span>
              </div>
            </div>
          )}

          {/* Search & Select Target Item */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Select Related Item
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by key, name, or content..."
                className="w-full h-8 pl-8 pr-3 text-xs border rounded-md bg-white dark:bg-[#0d1117] border-slate-300 dark:border-[#30363d] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Target Item List */}
            <div className="border border-slate-200 dark:border-[#30363d] rounded-md max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-[#21262d]">
              {isLoadingItems ? (
                <div className="p-4 text-center text-xs text-slate-400">Searching items...</div>
              ) : targetItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching items found in this project.
                </div>
              ) : (
                targetItems.map(item => {
                  const isSelected = selectedTargetItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTargetItem(item)}
                      className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-[#21262d] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-blue-600 dark:text-blue-400 shrink-0 font-bold">
                          {item.itemKey}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#30363d]">
                          {item.itemTypeName || 'Item'}
                        </span>
                        {item.status && (
                          <span className="text-[10px] text-slate-500">{item.status}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#30363d] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedTargetItem || createMutation.isPending}
              className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {createMutation.isPending ? 'Linking...' : 'Create Relationship'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
