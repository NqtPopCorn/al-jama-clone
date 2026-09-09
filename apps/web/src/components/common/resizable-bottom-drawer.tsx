import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useThemeStore } from '../../stores/theme.store';

export interface ResizableBottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  storageKey?: string;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  hideCloseButton?: boolean;
}

export const ResizableBottomDrawer: React.FC<ResizableBottomDrawerProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  badge,
  actions,
  children,
  storageKey,
  defaultHeight = 280,
  minHeight = 140,
  maxHeight: customMaxHeight,
  className = '',
  hideCloseButton = false,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const effectiveStorageKey = storageKey ? `aljama_drawer_${storageKey}` : null;

  // Initialize height from localStorage if available
  const [height, setHeight] = useState<number>(() => {
    if (effectiveStorageKey) {
      try {
        const saved = localStorage.getItem(effectiveStorageKey);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= minHeight) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return defaultHeight;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const preMaximizedHeightRef = useRef<number>(height);
  const startDragYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(height);

  const getMaxHeight = useCallback(() => {
    return customMaxHeight || Math.floor(window.innerHeight * 0.78);
  }, [customMaxHeight]);

  // Mouse drag handlers for vertical resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsMaximized(false);
    startDragYRef.current = e.clientY;
    startHeightRef.current = height;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startDragYRef.current - moveEvent.clientY;
      const maxH = getMaxHeight();
      const newHeight = Math.max(minHeight, Math.min(maxH, startHeightRef.current + deltaY));
      setHeight(newHeight);

      if (effectiveStorageKey) {
        try {
          localStorage.setItem(effectiveStorageKey, String(newHeight));
        } catch {
          // ignore
        }
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
    if (isMaximized) {
      setIsMaximized(false);
      setHeight(preMaximizedHeightRef.current);
      return;
    }

    setHeight(prev => {
      const next = prev > 350 ? defaultHeight : Math.min(getMaxHeight(), 520);
      if (effectiveStorageKey) {
        try {
          localStorage.setItem(effectiveStorageKey, String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const handleToggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setHeight(preMaximizedHeightRef.current);
    } else {
      preMaximizedHeightRef.current = height;
      setIsMaximized(true);
      setHeight(getMaxHeight());
    }
  };

  // Clean up global styles if unmounted while dragging
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{ height: `${height}px` }}
      className={`border-t flex flex-col shrink-0 select-none shadow-lg relative ${
        isDragging ? '' : 'transition-[height] duration-150 ease-out'
      } ${
        isDark
          ? 'bg-[#161b22] border-[#30363d] text-slate-200'
          : 'bg-white border-slate-300 text-slate-800'
      } ${className}`}
    >
      {/* Resizable Top Edge Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleToggleSize}
        className={`absolute -top-1.5 left-0 right-0 h-3 z-30 cursor-row-resize flex items-center justify-center group ${
          isDragging ? 'bg-blue-500/20' : 'hover:bg-blue-500/15'
        }`}
        title="Drag up / down to resize • Double click to expand / compact"
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

      {/* Header Toolbar */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b text-xs shrink-0 select-none ${
          isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
        }`}
      >
        {/* Left: Title, Icon, Badge */}
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && <span className="shrink-0 text-slate-500">{icon}</span>}
          <div className="font-bold tracking-wide truncate text-slate-700 dark:text-slate-300">
            {title}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {/* Right: Actions, Maximize toggle, Hide button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleMaximize}
            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            title={isMaximized ? 'Restore height' : 'Maximize drawer'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>

          {!hideCloseButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 gap-1"
            >
              <EyeOff className="w-3 h-3" />
              <span>Hide</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-auto select-text">{children}</div>
    </div>
  );
};
