import React, { useState } from 'react';
import { ResizableBottomDrawer } from '../../../components/common/resizable-bottom-drawer';
import { Button } from '../../../components/ui/button';
import {
  Link2,
  Plus,
  Network,
  Trash2,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ListFilter,
} from 'lucide-react';
import {
  useItemRelationships,
  useDeleteRelationship,
  useClearSuspect,
  useClearAllSuspects,
} from '../hooks/use-traceability';
import { RelateItemModal } from './relate-item-modal';
import { ImpactAnalysisModal } from './impact-analysis-modal';
import { ItemRelationshipSummary } from '@aljama/shared';

interface ItemRelationshipsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemKey: string;
  itemName: string;
  projectId: string;
  onNavigateToItem?: (itemId: string) => void;
}

type DrawerLayout = 'stacked' | 'upstream' | 'downstream';

export const ItemRelationshipsDrawer: React.FC<ItemRelationshipsDrawerProps> = ({
  isOpen,
  onClose,
  itemId,
  itemKey,
  itemName,
  projectId,
  onNavigateToItem,
}) => {
  const { data: relationships = [], isLoading } = useItemRelationships(isOpen ? itemId : null);
  const deleteMutation = useDeleteRelationship(itemId);
  const clearSuspectMutation = useClearSuspect(itemId);
  const clearAllSuspectsMutation = useClearAllSuspects(itemId);

  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false);
  const [relateInitialDirection, setRelateInitialDirection] = useState<'upstream' | 'downstream'>(
    'downstream',
  );
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [layout, setLayout] = useState<DrawerLayout>('stacked');

  if (!isOpen) return null;

  const suspectLinks = relationships.filter(r => r.isSuspect);
  const upstreamLinks = relationships.filter(r => r.direction === 'upstream');
  const downstreamLinks = relationships.filter(r => r.direction === 'downstream');

  const handleDelete = async (relId: string, targetKey: string) => {
    if (window.confirm(`Are you sure you want to remove relationship with ${targetKey}?`)) {
      await deleteMutation.mutateAsync(relId);
    }
  };

  const handleClearSuspect = async (relId: string) => {
    await clearSuspectMutation.mutateAsync(relId);
  };

  const handleClearAllSuspects = async () => {
    if (window.confirm(`Clear all ${suspectLinks.length} suspect flag(s) on this item?`)) {
      await clearAllSuspectsMutation.mutateAsync();
    }
  };

  const openRelateModal = (dir: 'upstream' | 'downstream' = 'downstream') => {
    setRelateInitialDirection(dir);
    setIsRelateModalOpen(true);
  };

  const headerActions = (
    <div className="flex items-center gap-1.5">
      {/* View Layout Switcher (Stacked default, Upstream only, Downstream only) */}
      <div className="flex items-center border border-slate-300 dark:border-[#30363d] rounded p-0.5 bg-white dark:bg-[#161b22] text-[11px]">
        <button
          type="button"
          onClick={() => setLayout('stacked')}
          className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
            layout === 'stacked'
              ? 'bg-slate-200 dark:bg-[#21262d] font-bold text-slate-900 dark:text-slate-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Stacked View (Show both Upstream and Downstream)"
        >
          <span className="flex items-center gap-1">
            <ListFilter className="w-3 h-3" />
            <span>Stacked</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setLayout('upstream')}
          className={`px-2 py-0.5 rounded font-medium transition-colors ${
            layout === 'upstream'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 font-bold shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Show Upstream Relationships Only"
        >
          <span>Upstream ({upstreamLinks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setLayout('downstream')}
          className={`px-2 py-0.5 rounded font-medium transition-colors ${
            layout === 'downstream'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 font-bold shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Show Downstream Relationships Only"
        >
          <span>Downstream ({downstreamLinks.length})</span>
        </button>
      </div>

      {suspectLinks.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearAllSuspects}
          disabled={clearAllSuspectsMutation.isPending}
          className="h-6 px-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 hover:bg-amber-100 gap-1"
        >
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          <span>Clear All Suspects ({suspectLinks.length})</span>
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsImpactModalOpen(true)}
        className="h-6 px-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 hover:bg-purple-100 gap-1"
      >
        <Network className="w-3 h-3 text-purple-600" />
        <span>Impact Analysis</span>
      </Button>

      {/* Single Add Relationship Button */}
      <Button
        type="button"
        size="sm"
        onClick={() => openRelateModal('downstream')}
        className="h-6 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-2xs"
        title="Add a new relationship link"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>+ Relate Item</span>
      </Button>
    </div>
  );

  return (
    <>
      <ResizableBottomDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Traceability & Relationships"
        icon={<Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
        badge={
          <div className="flex items-center gap-2">
            {suspectLinks.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                <Zap className="w-2.5 h-2.5 fill-amber-500" />
                {suspectLinks.length} Suspect
              </span>
            )}
          </div>
        }
        actions={headerActions}
        storageKey="relationships_drawer"
        defaultHeight={340}
        minHeight={180}
      >
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading relationships...</div>
        ) : (
          <div className="h-full flex flex-col p-3 space-y-4 overflow-y-auto">
            {/* Stacked View: Both sections full width vertically (Default) */}
            {layout === 'stacked' && (
              <div className="space-y-4">
                <UpstreamSection
                  links={upstreamLinks}
                  itemKey={itemKey}
                  onAdd={() => openRelateModal('upstream')}
                  onNavigate={onNavigateToItem}
                  onDelete={handleDelete}
                  onClearSuspect={handleClearSuspect}
                  isClearing={clearSuspectMutation.isPending}
                />
                <DownstreamSection
                  links={downstreamLinks}
                  itemKey={itemKey}
                  onAdd={() => openRelateModal('downstream')}
                  onNavigate={onNavigateToItem}
                  onDelete={handleDelete}
                  onClearSuspect={handleClearSuspect}
                  isClearing={clearSuspectMutation.isPending}
                />
              </div>
            )}

            {/* Upstream Focused View */}
            {layout === 'upstream' && (
              <UpstreamSection
                links={upstreamLinks}
                itemKey={itemKey}
                onAdd={() => openRelateModal('upstream')}
                onNavigate={onNavigateToItem}
                onDelete={handleDelete}
                onClearSuspect={handleClearSuspect}
                isClearing={clearSuspectMutation.isPending}
              />
            )}

            {/* Downstream Focused View */}
            {layout === 'downstream' && (
              <DownstreamSection
                links={downstreamLinks}
                itemKey={itemKey}
                onAdd={() => openRelateModal('downstream')}
                onNavigate={onNavigateToItem}
                onDelete={handleDelete}
                onClearSuspect={handleClearSuspect}
                isClearing={clearSuspectMutation.isPending}
              />
            )}
          </div>
        )}
      </ResizableBottomDrawer>

      {/* Relate Item Modal with pre-selected direction */}
      <RelateItemModal
        isOpen={isRelateModalOpen}
        onClose={() => setIsRelateModalOpen(false)}
        projectId={projectId}
        currentItem={{ id: itemId, itemKey, name: itemName }}
        initialDirection={relateInitialDirection}
      />

      {/* Impact Analysis Modal */}
      <ImpactAnalysisModal
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        itemId={itemId}
        itemKey={itemKey}
        itemName={itemName}
        onNavigateToItem={onNavigateToItem}
      />
    </>
  );
};

/* -------------------------------------------------------------------------
 * UPSTREAM SECTION COMPONENT (Parents, Sources, Requirements)
 * ------------------------------------------------------------------------- */
function UpstreamSection({
  links,
  itemKey,
  onAdd,
  onNavigate,
  onDelete,
  onClearSuspect,
  isClearing,
}: {
  links: ItemRelationshipSummary[];
  itemKey: string;
  onAdd: () => void;
  onNavigate?: (id: string) => void;
  onDelete: (id: string, key: string) => void;
  onClearSuspect: (id: string) => void;
  isClearing: boolean;
}) {
  return (
    <div className="rounded-lg border-2 border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-[#161f2e]/40 overflow-hidden shadow-2xs">
      {/* Section Header */}
      <div className="px-3 py-2 bg-blue-100/70 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
            <ArrowUpRight className="w-4 h-4 text-blue-600 shrink-0" />
            <span>UPSTREAM RELATIONSHIPS ({links.length})</span>
            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-200/80 dark:bg-blue-900/80 px-1.5 py-0.5 rounded">
              Cấp Trên / Nguồn
            </span>
          </div>
          <div className="text-[10px] text-blue-700/90 dark:text-blue-400 mt-0.5">
            Items nguồn cấp trên mà <strong>{itemKey}</strong> kế thừa hoặc đáp ứng (Parent
            Requirements, User Needs)
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="h-6 px-2 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 bg-white dark:bg-[#0d1117] hover:bg-blue-50 gap-1 shadow-2xs shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span>+ Add Upstream</span>
        </Button>
      </div>

      {/* Section Content: Table or Empty State */}
      {links.length === 0 ? (
        <div className="p-4 text-center space-y-1.5">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Chưa có liên kết Cấp trên (No Upstream Relationships)
          </div>
          <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Item này hiện chưa liên kết với yêu cầu cha (Parent Requirement) hay User Need nào ở cấp
            trên.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="h-6 text-xs text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 gap-1 font-semibold"
          >
            <Plus className="w-3 h-3 text-blue-600" />
            <span>+ Liên kết với yêu cầu cấp trên (Add Upstream)</span>
          </Button>
        </div>
      ) : (
        <table className="w-full text-left text-xs border-collapse">
          <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
            {links.map(rel => (
              <RelationshipRow
                key={rel.id}
                rel={rel}
                currentItemKey={itemKey}
                onNavigate={onNavigate}
                onDelete={() => onDelete(rel.id, rel.relatedItem.itemKey)}
                onClearSuspect={() => onClearSuspect(rel.id)}
                isClearing={isClearing}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * DOWNSTREAM SECTION COMPONENT (Children, Verification Tests, Use Cases)
 * ------------------------------------------------------------------------- */
function DownstreamSection({
  links,
  itemKey,
  onAdd,
  onNavigate,
  onDelete,
  onClearSuspect,
  isClearing,
}: {
  links: ItemRelationshipSummary[];
  itemKey: string;
  onAdd: () => void;
  onNavigate?: (id: string) => void;
  onDelete: (id: string, key: string) => void;
  onClearSuspect: (id: string) => void;
  isClearing: boolean;
}) {
  return (
    <div className="rounded-lg border-2 border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-[#20182b]/40 overflow-hidden shadow-2xs">
      {/* Section Header */}
      <div className="px-3 py-2 bg-purple-100/70 dark:bg-purple-950/60 border-b border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
            <ArrowDownRight className="w-4 h-4 text-purple-600 shrink-0" />
            <span>DOWNSTREAM RELATIONSHIPS ({links.length})</span>
            <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-200/80 dark:bg-purple-900/80 px-1.5 py-0.5 rounded">
              Cấp Dưới / Phụ Thuộc
            </span>
          </div>
          <div className="text-[10px] text-purple-700/90 dark:text-purple-400 mt-0.5">
            Items cấp dưới sẽ bị ảnh hưởng nếu <strong>{itemKey}</strong> thay đổi (Test Cases kiểm
            thử, Use Cases cấp dưới)
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="h-6 px-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 bg-white dark:bg-[#0d1117] hover:bg-purple-50 gap-1 shadow-2xs shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span>+ Add Downstream</span>
        </Button>
      </div>

      {/* Section Content: Table or Empty State */}
      {links.length === 0 ? (
        <div className="p-4 text-center space-y-1.5">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Chưa có liên kết Cấp dưới (No Downstream Relationships)
          </div>
          <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Chưa có Test Case hay Use Case nào kiểm thử hoặc phụ thuộc vào item này.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="h-6 text-xs text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 hover:bg-purple-50 gap-1 font-semibold"
          >
            <Plus className="w-3 h-3 text-purple-600" />
            <span>+ Thêm Test Case hoặc liên kết cấp dưới (Add Downstream)</span>
          </Button>
        </div>
      ) : (
        <table className="w-full text-left text-xs border-collapse">
          <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
            {links.map(rel => (
              <RelationshipRow
                key={rel.id}
                rel={rel}
                currentItemKey={itemKey}
                onNavigate={onNavigate}
                onDelete={() => onDelete(rel.id, rel.relatedItem.itemKey)}
                onClearSuspect={() => onClearSuspect(rel.id)}
                isClearing={isClearing}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * ROW COMPONENT WITH DIRECTION BADGE AND CLEAR INDICATORS
 * ------------------------------------------------------------------------- */
function RelationshipRow({
  rel,
  currentItemKey,
  onNavigate,
  onDelete,
  onClearSuspect,
  isClearing,
}: {
  rel: ItemRelationshipSummary;
  currentItemKey: string;
  onNavigate?: (id: string) => void;
  onDelete: () => void;
  onClearSuspect: () => void;
  isClearing: boolean;
}) {
  const isRequired = rel.relationshipType.isRequiredDefault;
  const isUpstream = rel.direction === 'upstream';
  const verbPhrase = isUpstream ? rel.relationshipType.name : rel.relationshipType.inverseName;

  return (
    <tr
      className={`transition-colors ${
        rel.isSuspect
          ? 'bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-950/50'
          : 'hover:bg-slate-50 dark:hover:bg-[#21262d]'
      }`}
    >
      {/* Relationship Type Badge (QT-03: Solid for required, Dashed for optional) */}
      <td className="py-2.5 px-3 w-44 align-middle">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold truncate ${
            isRequired
              ? isUpstream
                ? 'border-2 border-solid border-blue-500/80 bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                : 'border-2 border-solid border-purple-500/80 bg-purple-50/80 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200'
              : 'border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300'
          }`}
          title={
            isUpstream
              ? `${currentItemKey} ${verbPhrase} ${rel.relatedItem.itemKey} (${isRequired ? 'Bắt buộc' : 'Tuỳ chọn'})`
              : `${currentItemKey} is ${verbPhrase} ${rel.relatedItem.itemKey} (${isRequired ? 'Bắt buộc' : 'Tuỳ chọn'})`
          }
        >
          <span className="truncate">{verbPhrase}</span>
          <span className="text-[9px] opacity-70 font-mono shrink-0">
            {isRequired ? '[REQ]' : '[OPT]'}
          </span>
        </div>
      </td>

      {/* Target Item Key, Name, Type */}
      <td className="py-2.5 px-3 align-middle">
        <div className="flex items-center gap-2">
          <span
            onClick={() => onNavigate?.(rel.relatedItem.id)}
            className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
            title={`Click to view ${rel.relatedItem.itemKey}`}
          >
            {rel.relatedItem.itemKey}
          </span>
          <span
            className="font-normal text-slate-700 dark:text-slate-200 truncate"
            title={rel.relatedItem.name}
          >
            {rel.relatedItem.name}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#30363d] text-[10px] text-slate-500 shrink-0">
            {rel.relatedItem.itemTypeName}
          </span>
        </div>
      </td>

      {/* Suspect Flag Status & Clear Suspect (BR-TRACE-03, 04) */}
      <td className="py-2.5 px-3 w-56 align-middle">
        {rel.isSuspect ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shrink-0"
              title={rel.suspectReason || 'Upstream item was modified'}
            >
              <Zap className="w-3 h-3 fill-amber-600" />
              SUSPECT
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearSuspect}
              disabled={isClearing}
              className="h-5 px-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
              title="Clear suspect flag and acknowledge upstream changes"
            >
              Clear Suspect
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Clean</span>
            {rel.clearedBy && (
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                (by {rel.clearedBy.fullName})
              </span>
            )}
          </div>
        )}
      </td>

      {/* Action: Delete Link */}
      <td className="py-2.5 px-3 w-10 text-center align-middle">
        <button
          type="button"
          onClick={onDelete}
          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded"
          title="Remove relationship link"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
