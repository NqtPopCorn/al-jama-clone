import React, { useState, useEffect } from 'react';
import { FolderSummary } from '@aljama/shared';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useCreateFolder } from '../hooks/use-create-folder';
import { useThemeStore } from '../../../stores/theme.store';
import { X, Folder, FolderPlus, Loader2 } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  defaultParentFolderId?: string | null;
  folders: FolderSummary[];
  onFolderCreated?: (folder: FolderSummary) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  defaultParentFolderId,
  folders,
  onFolderCreated,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const [name, setName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string>(defaultParentFolderId || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const createFolderMutation = useCreateFolder();

  // Reset or update state whenever defaultParentFolderId or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setParentFolderId(defaultParentFolderId || '');
      setValidationError(null);
    }
  }, [isOpen, defaultParentFolderId]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Folder name is required.');
      return;
    }

    setValidationError(null);

    try {
      const result = await createFolderMutation.mutateAsync({
        projectId,
        dto: {
          name: trimmedName,
          parentFolderId: parentFolderId || null,
        },
      });

      if (onFolderCreated) {
        onFolderCreated(result);
      }
      onClose();
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Failed to create folder. Please try again.';
      setValidationError(message);
    }
  };

  const selectedParentFolder = folders.find(f => f.id === parentFolderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-lg shadow-2xl border flex flex-col overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-[#30363d] text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Modal Window Header */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#f6f8fa] border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold leading-none">Add Folder</h3>
              <span className="text-[11px] text-slate-500 font-normal">
                {projectName} {selectedParentFolder ? `› ${selectedParentFolder.name}` : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="mx-4 mt-3 p-2.5 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded flex items-center justify-between">
            <span>{validationError}</span>
            <button type="button" onClick={() => setValidationError(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Folder Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              Folder Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g. System Architecture, Core Delivery..."
              className="text-xs h-8"
              autoFocus
              maxLength={255}
            />
          </div>

          {/* Parent Folder Location */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Location / Parent Folder
            </label>
            <select
              value={parentFolderId}
              onChange={e => setParentFolderId(e.target.value)}
              className={`w-full h-8 px-2 border rounded text-xs focus:ring-0 ${
                isDark
                  ? 'bg-[#21262d] border-[#30363d] text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="">Project Root (Top Level)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 leading-tight">
              Select &quot;Project Root&quot; to place this folder at the top level of the project,
              or choose an existing folder to nest it.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-xs"
              disabled={createFolderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="jama"
              size="sm"
              className="h-8 px-4 text-xs font-semibold gap-1.5"
              disabled={createFolderMutation.isPending || !name.trim()}
            >
              {createFolderMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  Create Folder
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
