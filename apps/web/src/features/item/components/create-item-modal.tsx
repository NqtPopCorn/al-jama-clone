import React, { useState, useEffect } from 'react';
import { FolderSummary, ItemTypeWithFields, ProjectMemberSummary } from '@aljama/shared';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { TiptapEditor } from '../../../components/editor/tiptap-editor';
import { SelectUserModal } from './select-user-modal';
import { useCreateItem } from '../hooks/use-create-item';
import { useThemeStore } from '../../../stores/theme.store';
import { X, Minus, Square, Search, FileText, Layers, CheckCircle2 } from 'lucide-react';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  defaultFolderId?: string | null;
  defaultItemTypeId?: string | null;
  itemTypes: ItemTypeWithFields[];
  folders: FolderSummary[];
  members: ProjectMemberSummary[];
  onItemCreated?: (itemId: string) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  defaultFolderId,
  defaultItemTypeId,
  itemTypes,
  folders,
  members,
  onItemCreated,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [folderId, setFolderId] = useState<string>(defaultFolderId || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Draft');
  const [assignedUser, setAssignedUser] = useState<ProjectMemberSummary | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [notify, setNotify] = useState(false);
  const [addAnother, setAddAnother] = useState(false);
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createItemMutation = useCreateItem();

  // Set default item type when types are loaded or defaultItemTypeId changes
  useEffect(() => {
    if (defaultItemTypeId) {
      setSelectedTypeId(defaultItemTypeId);
    } else if (itemTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(itemTypes[0].id);
    }
  }, [defaultItemTypeId, itemTypes, selectedTypeId]);

  useEffect(() => {
    if (defaultFolderId) {
      setFolderId(defaultFolderId);
    }
  }, [defaultFolderId]);

  if (!isOpen) return null;

  const currentItemType = itemTypes.find(t => t.id === selectedTypeId) || itemTypes[0];
  const currentFolder = folders.find(f => f.id === folderId);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCustomFields({});
    setValidationError(null);
  };

  const handleCustomFieldChange = (key: string, value: unknown) => {
    setCustomFields(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (closeOnComplete: boolean) => {
    if (!name.trim()) {
      setValidationError('Item Name is required');
      return;
    }

    // Validate required custom fields
    if (currentItemType?.fields) {
      for (const field of currentItemType.fields) {
        if (field.isRequired && !customFields[field.fieldKey]) {
          setValidationError(`Field "${field.fieldLabel}" is required`);
          return;
        }
      }
    }

    setValidationError(null);

    try {
      const created = await createItemMutation.mutateAsync({
        projectId,
        dto: {
          name: name.trim(),
          itemTypeId: selectedTypeId,
          folderId: folderId || undefined,
          description: description || undefined,
          priority,
          status,
          assigneeId: assignedUser ? assignedUser.userId : undefined,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        },
      });

      if (onItemCreated) {
        onItemCreated(created.id);
      }

      if (closeOnComplete && !addAnother) {
        onClose();
        resetForm();
      } else {
        resetForm();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create item';
      setValidationError(errorMsg);
    }
  };

  const renderTypeIcon = (key?: string) => {
    switch (key) {
      case 'REQ':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'UC':
        return <Layers className="w-4 h-4 text-purple-500" />;
      case 'TC':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-md shadow-2xl border flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 ${
          isDark
            ? 'bg-[#1c2128] border-[#30363d] text-slate-200'
            : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* 1. Modal Title Bar matching Image 1 */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b select-none ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#333333] text-white border-slate-700'
          }`}
        >
          <span className="font-semibold text-xs tracking-wide">Add Item</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Sub-Header: Item Type & Breadcrumbs matching Image 1 */}
        <div
          className={`p-3.5 border-b flex items-start justify-between gap-4 ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#fcfdfe] border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {renderTypeIcon(currentItemType?.key)}
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                Add {currentItemType?.name || 'Requirement'}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{projectName}</span>
                <span>|</span>
                <span>{currentFolder?.name || 'Root (No folder)'}</span>
              </div>
            </div>
          </div>

          {/* Item Type Selector */}
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500 font-medium">Type:</label>
            <select
              value={selectedTypeId}
              onChange={e => setSelectedTypeId(e.target.value)}
              className={`h-7 px-2 border rounded text-xs focus:ring-0 ${
                isDark ? 'bg-[#21262d] border-[#30363d] text-white' : 'bg-white border-slate-300'
              }`}
            >
              {itemTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.key})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="mx-4 mt-3 p-2.5 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded flex items-center justify-between">
            <span>{validationError}</span>
            <button onClick={() => setValidationError(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span className="text-red-500">*</span>Name
            </label>
            <Input
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Enter requirement or use case name..."
              className="text-xs h-8 rounded border-slate-300 dark:border-slate-700"
              autoFocus
            />
          </div>

          {/* Description with Tiptap Editor */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe requirements, acceptance criteria, or steps..."
              className="min-h-[160px]"
            />
          </div>

          {/* Metadata Grid (Image 1 style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Assigned (with search icon button matching Image 1 & 3) */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Assigned</label>
              <div className="flex gap-1.5">
                <Input
                  readOnly
                  value={assignedUser ? `${assignedUser.fullName} (${assignedUser.username})` : ''}
                  placeholder="Unassigned"
                  className="text-xs h-8 rounded bg-slate-50 dark:bg-slate-800/60 cursor-pointer"
                  onClick={() => setIsUserPickerOpen(true)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUserPickerOpen(true)}
                  className="h-8 px-2.5 shrink-0"
                  title="Select user"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                </Button>
              </div>
            </div>

            {/* Folder Placement */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Folder</label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className={`w-full h-8 px-2 border rounded text-xs focus:ring-0 ${
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
            </div>

            {/* Priority Dropdown */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={`w-full h-8 px-2 border rounded text-xs focus:ring-0 ${
                  isDark ? 'bg-[#21262d] border-[#30363d] text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={`w-full h-8 px-2 border rounded text-xs focus:ring-0 ${
                  isDark ? 'bg-[#21262d] border-[#30363d] text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="Draft">Draft</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Dynamic Custom Fields based on ItemType (BR-ITEM-05) */}
          {currentItemType?.fields && currentItemType.fields.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {currentItemType.name} Custom Fields
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentItemType.fields.map(field => (
                  <div key={field.id} className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      {field.isRequired && <span className="text-red-500">*</span>}
                      {field.fieldLabel}
                    </label>
                    {field.fieldType === 'DROPDOWN' && Array.isArray(field.options) ? (
                      <select
                        value={String(customFields[field.fieldKey] || '')}
                        onChange={e => handleCustomFieldChange(field.fieldKey, e.target.value)}
                        className={`w-full h-8 px-2 border rounded text-xs focus:ring-0 ${
                          isDark
                            ? 'bg-[#21262d] border-[#30363d] text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        <option value="">Select option...</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={String(customFields[field.fieldKey] || '')}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleCustomFieldChange(field.fieldKey, e.target.value)
                        }
                        placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
                        className="text-xs h-8 rounded border-slate-300 dark:border-slate-700"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer matching Image 1 */}
        <div
          className={`flex items-center justify-between p-3 border-t select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
          }`}
        >
          {/* Left checkboxes: Notify */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              id="notify-cb"
              checked={notify}
              onChange={e => setNotify(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
            />
            <label htmlFor="notify-cb" className="cursor-pointer">
              Notify
            </label>
          </div>

          {/* Right actions: Add Another, Save, Save and Close, Cancel */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mr-2">
              <input
                type="checkbox"
                id="add-another-cb"
                checked={addAnother}
                onChange={e => setAddAnother(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
              />
              <label htmlFor="add-another-cb" className="cursor-pointer">
                Add Another
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={createItemMutation.isPending}
              className="h-7 text-xs px-3"
            >
              Save
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit(true)}
              disabled={createItemMutation.isPending}
              className="h-7 text-xs bg-[#24a0d9] hover:bg-[#1f8ec3] text-white font-medium px-3"
            >
              {createItemMutation.isPending ? 'Saving...' : 'Save and Close'}
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

      {/* Select User Picker Modal (Image 3) */}
      <SelectUserModal
        isOpen={isUserPickerOpen}
        onClose={() => setIsUserPickerOpen(false)}
        members={members}
        selectedUserId={assignedUser?.userId}
        onSelectUser={user => setAssignedUser(user)}
      />
    </div>
  );
};
