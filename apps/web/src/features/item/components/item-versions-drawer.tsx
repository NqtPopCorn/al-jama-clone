import React, { useState, useEffect, useRef } from 'react';
import { ItemVersionSummary } from '@aljama/shared';
import { Button } from '../../../components/ui/button';
import { Columns2, EyeOff, RotateCcw } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme.store';
import { useRevertVersion } from '../hooks/use-item-versions';

interface ItemVersionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  versions: ItemVersionSummary[];
  currentVersion: number;
  onCompare: (v1: number, v2: number) => void;
}

export const ItemVersionsDrawer: React.FC<ItemVersionsDrawerProps> = ({
  isOpen,
  onClose,
  itemId,
  versions,
  currentVersion,
  onCompare,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  // Default selection: From = older version, To = current version
  const [fromVersion, setFromVersion] = useState<number>(
    versions.length > 1 ? versions[versions.length - 1].versionNumber : 1,
  );
  const [toVersion, setToVersion] = useState<number>(currentVersion);

  // Drawer height state with persistent storage
  const [height, setHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aljama_versions_drawer_height');
      return saved ? Math.max(130, Math.min(650, parseInt(saved, 10))) : 260;
    } catch {
      return 260;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const startDragYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(height);

  const revertMutation = useRevertVersion();

  // Mouse drag handlers for vertical resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startDragYRef.current = e.clientY;
    startHeightRef.current = height;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startDragYRef.current - moveEvent.clientY;
      const maxHeight = Math.floor(window.innerHeight * 0.75);
      const newHeight = Math.max(130, Math.min(maxHeight, startHeightRef.current + deltaY));
      setHeight(newHeight);
      try {
        localStorage.setItem('aljama_versions_drawer_height', String(newHeight));
      } catch {
        // ignore
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Double click toggles between compact and expanded
  const handleToggleSize = () => {
    setHeight(prev => {
      const next = prev > 320 ? 220 : 460;
      try {
        localStorage.setItem('aljama_versions_drawer_height', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Ensure body styles are cleaned up if unmounted while dragging
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  if (!isOpen) return null;

  const handleCompareClick = () => {
    if (fromVersion && toVersion) {
      onCompare(Math.min(fromVersion, toVersion), Math.max(fromVersion, toVersion));
    }
  };

  const handleMakeCurrent = async (vNumber: number) => {
    if (window.confirm(`Are you sure you want to revert item to Version ${vNumber}?`)) {
      await revertMutation.mutateAsync({ itemId, versionNumber: vNumber });
    }
  };

  return (
    <div
      style={{ height: `${height}px` }}
      className={`border-t flex flex-col shrink-0 select-none shadow-lg relative ${
        isDragging ? '' : 'transition-[height] duration-100'
      } ${
        isDark
          ? 'bg-[#161b22] border-[#30363d] text-slate-200'
          : 'bg-white border-slate-300 text-slate-800'
      }`}
    >
      {/* Resizable Top Edge Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleToggleSize}
        className={`absolute -top-1.5 left-0 right-0 h-3 z-30 cursor-row-resize flex items-center justify-center group ${
          isDragging ? 'bg-blue-500/20' : 'hover:bg-blue-500/15'
        }`}
        title="Kéo lên / xuống để thay đổi kích thước drawer • Double click để mở rộng / thu gọn"
      >
        {/* Visual Pill Grip Indicator */}
        <div
          className={`h-1 rounded-full transition-all duration-150 ${
            isDragging
              ? 'w-16 bg-blue-500 shadow-sm'
              : isDark
                ? 'w-12 bg-slate-600 group-hover:w-16 group-hover:bg-blue-400'
                : 'w-12 bg-slate-400 group-hover:w-16 group-hover:bg-blue-500'
          }`}
        />
      </div>

      {/* 1. Header Toolbar matching Image 5: Compare & Hide buttons */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b text-xs shrink-0 ${
          isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wide text-slate-700 dark:text-slate-300">
            Version History
          </span>
          <span className="text-[11px] text-slate-500">
            ({versions.length} {versions.length === 1 ? 'version' : 'versions'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCompareClick}
            disabled={versions.length < 2 || fromVersion === toVersion}
            className="h-6 px-2.5 gap-1.5 text-xs font-semibold bg-white dark:bg-[#161b22] border-slate-300 shadow-2xs hover:bg-slate-50"
          >
            <Columns2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Compare</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700 gap-1"
          >
            <EyeOff className="w-3 h-3" />
            <span>Hide</span>
          </Button>
        </div>
      </div>

      {/* 2. Version Table matching Image 5 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead
            className={`sticky top-0 font-bold border-b select-none ${
              isDark
                ? 'bg-[#1c2128] border-[#30363d] text-slate-300'
                : 'bg-[#f9fafb] border-slate-200 text-slate-600'
            }`}
          >
            <tr>
              <th className="py-1.5 px-2 w-10 text-center border-r border-slate-200 dark:border-[#30363d]">
                From
              </th>
              <th className="py-1.5 px-2 w-10 text-center border-r border-slate-200 dark:border-[#30363d]">
                To
              </th>
              <th className="py-1.5 px-3 w-16 border-r border-slate-200 dark:border-[#30363d]">
                Version
              </th>
              <th className="py-1.5 px-3 w-24 border-r border-slate-200 dark:border-[#30363d]">
                Baselines
              </th>
              <th className="py-1.5 px-3 border-r border-slate-200 dark:border-[#30363d]">
                Change Details
              </th>
              <th className="py-1.5 px-3 border-r border-slate-200 dark:border-[#30363d]">
                User Comment
              </th>
              <th className="py-1.5 px-3 w-36 border-r border-slate-200 dark:border-[#30363d]">
                Created
              </th>
              <th className="py-1.5 px-3 w-32 border-r border-slate-200 dark:border-[#30363d]">
                By
              </th>
              <th className="py-1.5 px-3 w-28 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
            {versions.map(ver => {
              const isCurrent = ver.versionNumber === currentVersion;
              return (
                <tr
                  key={ver.id}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-[#21262d]' : 'hover:bg-[#f5f8fa]'
                  }`}
                >
                  {/* From Radio */}
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 dark:border-[#30363d]">
                    <input
                      type="radio"
                      name="fromVersion"
                      checked={fromVersion === ver.versionNumber}
                      onChange={() => setFromVersion(ver.versionNumber)}
                      className="text-blue-600 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>

                  {/* To Radio */}
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 dark:border-[#30363d]">
                    <input
                      type="radio"
                      name="toVersion"
                      checked={toVersion === ver.versionNumber}
                      onChange={() => setToVersion(ver.versionNumber)}
                      className="text-blue-600 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>

                  {/* Version Number */}
                  <td className="py-1.5 px-3 font-bold text-[#0088cc] border-r border-slate-200 dark:border-[#30363d]">
                    {ver.versionNumber}{' '}
                    {isCurrent && (
                      <span className="text-[10px] text-slate-400 font-normal">(current)</span>
                    )}
                  </td>

                  {/* Baselines */}
                  <td className="py-1.5 px-3 text-slate-400 border-r border-slate-200 dark:border-[#30363d] italic text-[11px]">
                    None
                  </td>

                  {/* Change Details */}
                  <td className="py-1.5 px-3 font-normal text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#30363d]">
                    {ver.changeDetails ||
                      (ver.versionNumber === 1 ? 'Initial creation' : '"Description" changed')}
                  </td>

                  {/* User Comment */}
                  <td className="py-1.5 px-3 text-slate-500 border-r border-slate-200 dark:border-[#30363d] italic">
                    {ver.changeComment || '—'}
                  </td>

                  {/* Created Date */}
                  <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap border-r border-slate-200 dark:border-[#30363d]">
                    {new Date(ver.changedAt).toLocaleString(undefined, {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* By (User) */}
                  <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#30363d] truncate">
                    {ver.changedBy.fullName}
                  </td>

                  {/* Action link: Make Current */}
                  <td className="py-1.5 px-3 text-center">
                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() => handleMakeCurrent(ver.versionNumber)}
                        disabled={revertMutation.isPending}
                        className="text-[#0088cc] hover:underline font-semibold flex items-center justify-center gap-1 mx-auto text-[11px]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Make Current
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-medium text-[11px]">Active</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
