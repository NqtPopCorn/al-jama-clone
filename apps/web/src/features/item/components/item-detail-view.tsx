import React, { useState } from 'react';
import { useItemDetail } from '../hooks/use-item-detail';
import { useUpdateItem } from '../hooks/use-update-item';
import { useLockItem } from '../hooks/use-lock-item';
import { useItemVersions } from '../hooks/use-item-versions';
import { useProjectMeta } from '../hooks/use-project-meta';
import { itemApi } from '../api/item.api';
import { ItemRightBar, RightBarPanel } from './item-right-bar';
import { ItemVersionsDrawer } from './item-versions-drawer';
import { ItemRelationshipsDrawer } from '../../traceability/components/item-relationships-drawer';
import { ResizableBottomDrawer } from '../../../components/common/resizable-bottom-drawer';
import { VersionDiffCanvas } from './version-diff-canvas';
import { JamaStreamSection } from '../../collaboration/components/JamaStreamSection';
import { TiptapEditor } from '../../../components/editor/tiptap-editor';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { useThemeStore } from '../../../stores/theme.store';
import { useAuthStore } from '../../../stores/auth.store';
import {
  Lock,
  Star,
  Copy,
  ChevronDown,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  User,
  MessageSquare,
  Activity,
  Trash2,
} from 'lucide-react';

interface ItemDetailViewProps {
  itemId: string;
  projectId: string;
  projectName?: string;
  onCloseTab?: () => void;
  onOpenCreateItem?: () => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  itemId,
  projectId,
  projectName = 'Project',
  onCloseTab,
  onOpenCreateItem,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';
  const { user } = useAuthStore();

  const { data: item, isLoading, error } = useItemDetail(itemId);
  const { data: versions = [] } = useItemVersions(itemId);
  const { members } = useProjectMeta(projectId);

  const updateItemMutation = useUpdateItem();
  const { lock, unlock, isLocking } = useLockItem(itemId);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('Draft');
  const [editAssigneeId, setEditAssigneeId] = useState<string>('');
  const [editFolderId, setEditFolderId] = useState<string>('');
  const [editCustomFields, setEditCustomFields] = useState<Record<string, unknown>>({});
  const [changeComment, setChangeComment] = useState('');

  // Right bar active panel
  const [activePanel, setActivePanel] = useState<RightBarPanel>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Compare versions modal state
  const [compareVersions, setCompareVersions] = useState<{ v1: number; v2: number } | null>(null);

  // Initialize form when entering Edit mode
  const startEditing = async () => {
    if (!item) return;

    // Try to acquire lock
    try {
      await lock();
    } catch {
      // If locked by someone else, prevent editing
      return;
    }

    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditPriority(item.priority || 'Medium');
    setEditStatus(item.status || 'Draft');
    setEditAssigneeId(item.assignee?.id || '');
    setEditFolderId(item.folderId || '');
    setEditCustomFields((item.customFields as Record<string, unknown>) || {});
    setChangeComment('');
    setIsEditing(true);
  };

  const cancelEditing = async () => {
    setIsEditing(false);
    try {
      await unlock();
    } catch (e) {
      console.error('Error unlocking:', e);
    }
  };

  const handleSave = async (andDone: boolean = true) => {
    if (!item) return;

    try {
      await updateItemMutation.mutateAsync({
        itemId: item.id,
        projectId,
        dto: {
          name: editName.trim(),
          description: editDescription,
          priority: editPriority,
          status: editStatus,
          assigneeId: editAssigneeId || undefined,
          folderId: editFolderId || undefined,
          customFields: editCustomFields,
          changeComment: changeComment.trim() || undefined,
        },
      });

      if (andDone) {
        setIsEditing(false);
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const handleToggleSubscribe = async () => {
    try {
      await itemApi.toggleSubscription(itemId);
    } catch (e) {
      console.error('Toggle subscription failed:', e);
    }
  };

  const handleReuse = async () => {
    if (!item) return;
    try {
      const cloned = await itemApi.reuseItem(itemId, {});
      alert(`Item cloned successfully as ${cloned.itemKey}`);
    } catch (e) {
      console.error('Reuse failed:', e);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await itemApi.deleteItem(itemId);
      if (onCloseTab) onCloseTab();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mr-3" />
        <span>Loading item details...</span>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
        <span className="font-semibold text-sm">Failed to load item</span>
        <span className="text-xs text-slate-400 mt-1">
          Item may have been removed or you do not have permission.
        </span>
      </div>
    );
  }

  const isLockedBySomeoneElse = item.isLocked && item.lockedBy && item.lockedBy.id !== user?.id;

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
    <div className="flex-1 flex overflow-hidden font-sans">
      {/* Main Item Workspace Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0d1117] transition-colors">
        {/* 1. Sub-Header Controls matching Image 4: Add v, View v, Actions v, Export v, Edit */}
        <div
          className={`flex items-center justify-between px-4 py-1.5 border-b text-xs select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
          }`}
        >
          {/* Left Menus matching Image 4 */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenCreateItem}
              className="h-6 px-2 gap-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60"
            >
              <span>Add</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60"
            >
              <span>View</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60"
            >
              <span>Actions</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60"
            >
              <span>Export</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </Button>
          </div>

          {/* Right Controls: Edit button / Lock indicator & Quick actions matching Image 4 */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mr-1">
                  <Lock className="w-3.5 h-3.5" /> Editing Mode (Locked)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  className="h-6 px-2.5 text-xs hover:bg-slate-200/60 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={updateItemMutation.isPending}
                  className="h-6 px-2.5 text-xs bg-slate-700 hover:bg-slate-800 text-white font-medium shadow-2xs"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={updateItemMutation.isPending}
                  className="h-6 px-2.5 text-xs bg-[#24a0d9] hover:bg-[#1f8ec3] text-white font-medium shadow-2xs"
                >
                  {updateItemMutation.isPending ? 'Saving...' : 'Save & Done'}
                </Button>
              </div>
            ) : isLockedBySomeoneElse ? (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Locked by {item.lockedBy?.fullName}
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={startEditing}
                disabled={isLockedBySomeoneElse || isLocking}
                className="h-6 px-3 text-xs bg-[#24a0d9] hover:bg-[#1f8ec3] text-white font-medium shadow-2xs"
              >
                Edit
              </Button>
            )}

            {/* Subscribe toggle button */}
            <button
              type="button"
              onClick={handleToggleSubscribe}
              title={
                item.isSubscribed ? 'Unsubscribe' : 'Subscribe to email notifications (BR-ITEM-08)'
              }
              className={`p-1.5 rounded transition-colors ${
                item.isSubscribed
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${item.isSubscribed ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Reuse Item */}
            <button
              type="button"
              onClick={handleReuse}
              title="Reuse / Clone Item (BR-ITEM-03)"
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Delete Item */}
            <button
              type="button"
              onClick={handleDelete}
              title="Delete Item"
              className="p-1.5 rounded text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Concurrency Lock Banner (QT-01) */}
        {isLockedBySomeoneElse && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                Item is currently locked by <strong>{item.lockedBy?.fullName}</strong> — You are in
                View-Only mode.
              </span>
            </div>
            <span className="text-[11px] opacity-75">QT-01 Concurrency Protection</span>
          </div>
        )}

        {/* 2. Main Content Canvas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Card matching Image 4 */}
          <div className="border-b pb-4 border-slate-200 dark:border-[#30363d] space-y-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-1">
                {renderTypeIcon(item.itemTypeKey)}
              </div>
              <div className="flex-1">
                {/* Title (Image 4 & 5 format: "Scheduling conflicts - V2") */}
                {isEditing ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Item Name *
                    </label>
                    <Input
                      value={editName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditName(e.target.value)
                      }
                      className="text-base font-bold h-9 rounded border-slate-300 dark:border-slate-700"
                    />
                  </div>
                ) : (
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{item.name}</span>
                    <Badge variant="outline" className="text-[11px] font-mono py-0 h-5">
                      v{item.currentVersion}
                    </Badge>
                  </h1>
                )}

                {/* Breadcrumb line matching Image 4 */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-[#0088cc] hover:underline cursor-pointer">
                    {item.itemKey}
                  </span>
                  <span>·</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {item.itemTypeName}
                  </span>
                  <span className="opacity-40">|</span>
                  <span>{projectName}</span>
                  <span>»</span>
                  <span>{item.folder ? item.folder.name : 'Root'}</span>
                  <span>»</span>
                  <span>{item.itemTypeName}s</span>
                </div>
              </div>
            </div>

            {/* Quick Metadata Row matching Image 4 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  ID:
                </span>
                <span className="font-bold text-[#0088cc] font-mono">{item.itemKey}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Status:
                </span>
                {isEditing ? (
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className={`h-7 px-2 border rounded text-xs w-full mt-0.5 ${
                      isDark
                        ? 'bg-[#21262d] border-[#30363d] text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <Badge variant="secondary" className="mt-0.5">
                    {item.status || 'Draft'}
                  </Badge>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Priority:
                </span>
                {isEditing ? (
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value)}
                    className={`h-7 px-2 border rounded text-xs w-full mt-0.5 ${
                      isDark
                        ? 'bg-[#21262d] border-[#30363d] text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                ) : (
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.priority || 'Medium'}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Assignee:
                </span>
                {isEditing ? (
                  <select
                    value={editAssigneeId}
                    onChange={e => setEditAssigneeId(e.target.value)}
                    className={`h-7 px-2 border rounded text-xs w-full mt-0.5 ${
                      isDark
                        ? 'bg-[#21262d] border-[#30363d] text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.assignee ? (
                      <>
                        {item.assignee.avatarUrl ? (
                          <img
                            src={item.assignee.avatarUrl}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="font-medium">{item.assignee.fullName}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section (Tiptap Rich Text Editor) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Description:
            </span>
            {isEditing ? (
              <TiptapEditor
                content={editDescription}
                onChange={setEditDescription}
                placeholder="Type requirement description..."
                className="min-h-[220px]"
              />
            ) : (
              <div
                className={`p-4 rounded border min-h-[140px] text-xs leading-relaxed font-sans prose prose-sm max-w-none dark:prose-invert ${
                  isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#fafbfc] border-slate-200'
                }`}
                dangerouslySetInnerHTML={{
                  __html:
                    item.description ||
                    '<span class="text-slate-400 italic">No description entered yet. Click "Edit" above to add formatted details.</span>',
                }}
              />
            )}
          </div>

          {/* Custom Fields Section */}
          {item.customFields && Object.keys(item.customFields).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Custom Fields
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(item.customFields).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2 rounded border border-slate-200 dark:border-[#30363d] bg-slate-50 dark:bg-slate-900/40 text-xs"
                  >
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {String(val || '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Comment field when Editing */}
          {isEditing && (
            <div className="space-y-1.5 p-3 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs">
              <label className="font-semibold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                <span>Change Comment / Revision Note (Optional)</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Saved with Version {item.currentVersion + 1}
                </span>
              </label>
              <Input
                value={changeComment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setChangeComment(e.target.value)
                }
                placeholder="e.g. Updated safety threshold per ISO review..."
                className="text-xs h-8 bg-white dark:bg-[#161b22]"
              />
            </div>
          )}
        </div>

        {/* 3. Bottom Sliding Drawer for Versions (Matching Image 5) */}
        <ItemVersionsDrawer
          isOpen={activePanel === 'versions'}
          onClose={() => setActivePanel(null)}
          itemId={item.id}
          versions={versions}
          currentVersion={item.currentVersion}
          onCompare={(v1, v2) => setCompareVersions({ v1, v2 })}
        />

        {/* Relationships Panel Drawer */}
        <ItemRelationshipsDrawer
          isOpen={activePanel === 'relationships'}
          onClose={() => setActivePanel(null)}
          itemId={item.id}
          itemKey={item.itemKey}
          itemName={item.name}
          projectId={projectId}
        />

        {/* Connected Users Panel Drawer */}
        <ResizableBottomDrawer
          isOpen={activePanel === 'connected_users'}
          onClose={() => setActivePanel(null)}
          title="Connected Users"
          icon={<User className="w-4 h-4 text-blue-600" />}
          badge={
            <span className="text-[11px] text-slate-500">
              ({item.connectedUsersCount || 1} active)
            </span>
          }
          storageKey="users_drawer"
          defaultHeight={220}
          minHeight={130}
        >
          <div className="p-3">
            <div className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {item.creator.fullName[0]}
              </div>
              <div>
                <span className="font-semibold block text-xs">{item.creator.fullName}</span>
                <span className="text-[10px] text-slate-400">Creator & Editor</span>
              </div>
            </div>
          </div>
        </ResizableBottomDrawer>

        {/* Comments Panel Drawer */}
        <ResizableBottomDrawer
          isOpen={activePanel === 'comments'}
          onClose={() => setActivePanel(null)}
          title="Item Stream & Comments"
          icon={<MessageSquare className="w-4 h-4 text-[#0088cc]" />}
          storageKey="comments_drawer"
          defaultHeight={380}
          minHeight={180}
        >
          <div className="p-4 overflow-y-auto h-full bg-[#f7f9fa] dark:bg-[#0d1117]">
            <JamaStreamSection itemId={item.id} projectId={projectId} />
          </div>
        </ResizableBottomDrawer>

        {/* Activity Panel Drawer */}
        <ResizableBottomDrawer
          isOpen={activePanel === 'activity'}
          onClose={() => setActivePanel(null)}
          title="Recent Activities"
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          storageKey="activity_drawer"
          defaultHeight={220}
          minHeight={130}
        >
          <div className="p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>
                Version {item.currentVersion} published by <strong>{item.creator.fullName}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 ml-4">
              Created at {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
        </ResizableBottomDrawer>
      </div>

      {/* 4. Right Action Bar with circular icon buttons strictly matching Image 4 */}
      <ItemRightBar
        activePanel={activePanel}
        onTogglePanel={setActivePanel}
        relationshipsCount={item.relationshipsCount}
        connectedUsersCount={item.connectedUsersCount}
        commentsCount={item.commentsCount}
        currentVersion={item.currentVersion}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {/* 5. Version Comparison Redline/Greenline Modal */}
      {compareVersions && (
        <VersionDiffCanvas
          isOpen={!!compareVersions}
          onClose={() => setCompareVersions(null)}
          itemId={item.id}
          itemKey={item.itemKey}
          version1={compareVersions.v1}
          version2={compareVersions.v2}
        />
      )}
    </div>
  );
};
