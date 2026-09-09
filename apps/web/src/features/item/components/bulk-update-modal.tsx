import React, { useState } from 'react';
import { FolderSummary, ProjectMemberSummary } from '@aljama/shared';
import { Button } from '../../../components/ui/button';
import { X, Layers } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme.store';
import { useBulkUpdateItems } from '../hooks/use-bulk-update-items';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  selectedItemIds: string[];
  folders: FolderSummary[];
  members: ProjectMemberSummary[];
  onComplete?: () => void;
}

export const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  projectId,
  selectedItemIds,
  folders,
  members,
  onComplete,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const [updatePriority, setUpdatePriority] = useState(false);
  const [priority, setPriority] = useState('Medium');

  const [updateStatus, setUpdateStatus] = useState(false);
  const [status, setStatus] = useState('In Review');

  const [updateAssignee, setUpdateAssignee] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>('');

  const [updateFolder, setUpdateFolder] = useState(false);
  const [folderId, setFolderId] = useState<string>('');

  const bulkMutation = useBulkUpdateItems();

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!updatePriority && !updateStatus && !updateAssignee && !updateFolder) {
      alert('Please check at least one field to update.');
      return;
    }

    await bulkMutation.mutateAsync({
      projectId,
      dto: {
        itemIds: selectedItemIds,
        priority: updatePriority ? priority : undefined,
        status: updateStatus ? status : undefined,
        assigneeId: updateAssignee ? assigneeId || null : undefined,
        folderId: updateFolder ? folderId || null : undefined,
      },
    });

    if (onComplete) onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className={`w-full max-w-md rounded-md shadow-2xl border flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 ${
          isDark
            ? 'bg-[#1c2128] border-[#30363d] text-slate-200'
            : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* Title Bar */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b select-none ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#333333] text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-xs tracking-wide">
              Bulk Update ({selectedItemIds.length} items)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs font-sans">
          <p className="text-slate-500">
            Check the fields you want to update simultaneously across all{' '}
            <strong className="text-slate-800 dark:text-slate-200">{selectedItemIds.length}</strong>{' '}
            selected items:
          </p>

          {/* 1. Priority */}
          <div className="space-y-1.5 p-2 rounded border border-slate-200 dark:border-[#30363d]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-priority-cb"
                checked={updatePriority}
                onChange={e => setUpdatePriority(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
              />
              <label htmlFor="update-priority-cb" className="font-semibold cursor-pointer">
                Change Priority
              </label>
            </div>
            {updatePriority && (
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={`w-full h-8 px-2 border rounded text-xs mt-1 ${
                  isDark ? 'bg-[#21262d] border-[#30363d] text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            )}
          </div>

          {/* 2. Status */}
          <div className="space-y-1.5 p-2 rounded border border-slate-200 dark:border-[#30363d]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-status-cb"
                checked={updateStatus}
                onChange={e => setUpdateStatus(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
              />
              <label htmlFor="update-status-cb" className="font-semibold cursor-pointer">
                Change Workflow Status
              </label>
            </div>
            {updateStatus && (
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={`w-full h-8 px-2 border rounded text-xs mt-1 ${
                  isDark ? 'bg-[#21262d] border-[#30363d] text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="Draft">Draft</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
              </select>
            )}
          </div>

          {/* 3. Assignee */}
          <div className="space-y-1.5 p-2 rounded border border-slate-200 dark:border-[#30363d]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-assignee-cb"
                checked={updateAssignee}
                onChange={e => setUpdateAssignee(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
              />
              <label htmlFor="update-assignee-cb" className="font-semibold cursor-pointer">
                Change Assignee
              </label>
            </div>
            {updateAssignee && (
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className={`w-full h-8 px-2 border rounded text-xs mt-1 ${
                  isDark ? 'bg-[#21262d] border-[#30363d] text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} ({m.username})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 4. Folder */}
          <div className="space-y-1.5 p-2 rounded border border-slate-200 dark:border-[#30363d]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-folder-cb"
                checked={updateFolder}
                onChange={e => setUpdateFolder(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
              />
              <label htmlFor="update-folder-cb" className="font-semibold cursor-pointer">
                Move to Folder
              </label>
            </div>
            {updateFolder && (
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className={`w-full h-8 px-2 border rounded text-xs mt-1 ${
                  isDark ? 'bg-[#21262d] border-[#30363d] text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="">Root Level (No folder)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-end gap-2 p-3 border-t select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
          }`}
        >
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={bulkMutation.isPending}
            className="h-7 text-xs bg-[#24a0d9] hover:bg-[#1f8ec3] text-white font-medium px-3 shadow-xs"
          >
            {bulkMutation.isPending ? 'Updating...' : `Apply to ${selectedItemIds.length} Items`}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs px-3"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
