import React from 'react';
import { Button } from '../../../components/ui/button';
import { Edit3, X } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme.store';

interface BulkActionBarProps {
  selectedCount: number;
  onOpenBulkEdit: () => void;
  onClearSelection: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onOpenBulkEdit,
  onClearSelection,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in-50 slide-in-from-bottom-4 duration-150 select-none">
      <div
        className={`flex items-center gap-4 px-4 py-2.5 rounded-lg shadow-2xl border ${
          isDark
            ? 'bg-[#1c2128] border-[#30363d] text-slate-100'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        <span className="text-xs font-semibold tracking-wide">
          <span className="text-blue-400 font-bold">{selectedCount}</span>{' '}
          {selectedCount === 1 ? 'item' : 'items'} selected
        </span>

        <div className="h-4 w-[1px] bg-slate-600" />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onOpenBulkEdit}
            className="h-7 px-3 text-xs bg-[#24a0d9] hover:bg-[#1f8ec3] text-white font-medium gap-1.5 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Bulk Edit</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
