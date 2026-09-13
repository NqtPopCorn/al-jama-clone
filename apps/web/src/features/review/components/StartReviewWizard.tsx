import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileCheck,
  Users,
  User,
  Search,
  ChevronDown,
  ChevronRight,
  HelpCircle as QuestionIcon,
  AlertCircle,
  Plus,
  FolderTree,
  Trash2,
} from 'lucide-react';
import { useCreateReviewMutation } from '../hooks/useReviewApi';
import { ReviewRole, ReviewTemplateType, CreateReviewParticipantInput } from '@aljama/shared';
import { useAuthStore } from '../../../stores/auth.store';
import { useProjectMeta } from '../../item/hooks/use-project-meta';
import { ProjectItemPickerModal } from './ProjectItemPickerModal';

export type SignerRole =
  | 'Not assigned'
  | 'Company Wide Access'
  | 'Organization Admin'
  | 'Project Admin'
  | 'R&D'
  | 'Regulatory';

export const SIGNER_ROLES: SignerRole[] = [
  'Not assigned',
  'Company Wide Access',
  'Organization Admin',
  'Project Admin',
  'R&D',
  'Regulatory',
];

export interface ReviewWizardItemInfo {
  id: string;
  key: string;
  name: string;
  itemTypeKey?: string;
  itemTypeName?: string;
  status?: string;
  currentVersion?: number;
  priority?: string;
}

interface AvailableParticipant {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  isGroup?: boolean;
  subtitle?: string;
}

interface AssignedParticipant {
  id: string;
  userId?: string;
  groupId?: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  isGroup?: boolean;
  signerRole: SignerRole;
  reviewRole: 'APPROVER' | 'REVIEWER';
}

interface StartReviewWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  preselectedItemIds?: string[];
  initialItems?: ReviewWizardItemInfo[];
  defaultReviewName?: string;
  sourceFilterName?: string;
  members?: Array<{ userId: string; fullName: string; username: string; avatarUrl?: string | null }>;
  onSuccess?: (reviewId: string) => void;
}

export const StartReviewWizard: React.FC<StartReviewWizardProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  preselectedItemIds = [],
  initialItems,
  defaultReviewName,
  sourceFilterName,
  members = [],
  onSuccess,
}) => {
  const currentUser = useAuthStore(s => s.user);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // --- Step 1: Definition State ---
  // When opening from "Start a review" button: name is empty by default
  // When opening from "Send for review": name is initialized from defaultReviewName
  const [name, setName] = useState(defaultReviewName || '');

  // Items for review: empty by default when clicking "Start a review"
  const [reviewItems, setReviewItems] = useState<ReviewWizardItemInfo[]>(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    return [];
  });

  const [isItemListExpanded, setIsItemListExpanded] = useState(true);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);

  // Sync state if props change
  useEffect(() => {
    if (defaultReviewName !== undefined) {
      setName(defaultReviewName);
      setSubject(defaultReviewName ? `[AL-JAMA] REVIEW: ${defaultReviewName}` : '');
      setInvitationMessage(
        defaultReviewName
          ? `Bạn được mời tham gia đợt review cho ${defaultReviewName}. Nhấp vào liên kết bên dưới để bắt đầu review và gửi ý kiến phản hồi.`
          : '',
      );
    }
  }, [defaultReviewName]);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setReviewItems(initialItems);
    }
  }, [initialItems]);

  const [deadlineDate, setDeadlineDate] = useState('2026-10-26');
  const [deadlineTime, setDeadlineTime] = useState('17:00 EDT');
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeRelatedItems, setIncludeRelatedItems] = useState(false);

  // Upstream / Downstream related items checkboxes
  const [showUpstream, setShowUpstream] = useState(false);
  const [showDownstream, setShowDownstream] = useState(false);
  const [selectedUpstreamTypes, setSelectedUpstreamTypes] = useState<string[]>([]);
  const [selectedDownstreamTypes, setSelectedDownstreamTypes] = useState<string[]>([]);

  // --- Step 2: Settings State ---
  const [templateType, setTemplateType] = useState<ReviewTemplateType>(ReviewTemplateType.APPROVAL);

  const [requireSignature, setRequireSignature] = useState(false);
  const [enableSignerRole, setEnableSignerRole] = useState(false);
  const [allowCommentsInProject, setAllowCommentsInProject] = useState(true);
  const [allowApproversAddParticipants, setAllowApproversAddParticipants] = useState(true);
  const [allowApproversDelegate, setAllowApproversDelegate] = useState(false);
  const [enableTimeTracking, setEnableTimeTracking] = useState(true);
  const [notifyParticipantFinishes, setNotifyParticipantFinishes] = useState(false);
  const [enableVoting, setEnableVoting] = useState(false);

  // --- Step 3: Participants State ---
  const [participantTab, setParticipantTab] = useState<'team' | 'email'>('team');
  const [searchParticipant, setSearchParticipant] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Fetch real project members if not passed from parent
  const { members: queriedMembers } = useProjectMeta(projectId);

  const effectiveMembers = useMemo(() => {
    if (members && members.length > 0) return members;
    return queriedMembers || [];
  }, [members, queriedMembers]);

  // Real available participants from project members
  const availableParticipants = useMemo<AvailableParticipant[]>(() => {
    if (!effectiveMembers || effectiveMembers.length === 0) return [];
    return effectiveMembers.map(m => ({
      id: m.userId,
      userId: m.userId,
      name: m.fullName || m.username,
      email: `${m.username}@aljama.local`,
      avatarUrl: m.avatarUrl,
      isGroup: false,
      subtitle: (m as { projectRole?: string }).projectRole || 'Thành viên dự án',
    }));
  }, [effectiveMembers]);

  // Initial assignments with real project members
  const [assignedParticipants, setAssignedParticipants] = useState<AssignedParticipant[]>([]);
  const [hasInitializedAssignments, setHasInitializedAssignments] = useState(false);

  useEffect(() => {
    if (!hasInitializedAssignments && availableParticipants.length > 0) {
      // By default, add project members (prioritize other members if current user is moderator)
      const others = availableParticipants.filter(p => p.userId !== currentUser?.id);
      const toAssign = others.length > 0 ? others : availableParticipants;
      setAssignedParticipants(
        toAssign.map(p => ({
          id: p.id,
          userId: p.userId,
          name: p.name,
          email: p.email,
          avatarUrl: p.avatarUrl,
          isGroup: false,
          signerRole: 'Not assigned' as SignerRole,
          reviewRole: p.name.toLowerCase().includes('reviewer')
            ? ('REVIEWER' as const)
            : ('APPROVER' as const),
        })),
      );
      setHasInitializedAssignments(true);
    }
  }, [availableParticipants, currentUser?.id, hasInitializedAssignments]);

  const filteredAvailable = useMemo(() => {
    if (!searchParticipant.trim()) return availableParticipants;
    const q = searchParticipant.toLowerCase();
    return availableParticipants.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)),
    );
  }, [availableParticipants, searchParticipant]);

  // --- Step 4: Invitation State ---
  const [subject, setSubject] = useState(
    defaultReviewName ? `[AL-JAMA] REVIEW: ${defaultReviewName}` : '',
  );
  const [isSubjectDirty, setIsSubjectDirty] = useState(false);

  const [invitationMessage, setInvitationMessage] = useState(
    defaultReviewName
      ? `Bạn được mời tham gia đợt review cho ${defaultReviewName}. Nhấp vào liên kết bên dưới để bắt đầu review và gửi ý kiến phản hồi.`
      : '',
  );
  const [isMessageDirty, setIsMessageDirty] = useState(false);

  // Sync subject and message when review name changes in Step 1
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!isSubjectDirty) {
      setSubject(newName.trim() ? `[AL-JAMA] REVIEW: ${newName}` : '');
    }
    if (!isMessageDirty) {
      setInvitationMessage(
        newName.trim()
          ? `Bạn được mời tham gia đợt review cho ${newName}. Nhấp vào liên kết bên dưới để bắt đầu review và gửi ý kiến phản hồi.`
          : '',
      );
    }
  };

  // Participant counts summary for Step 4
  const approversCount = assignedParticipants.filter(p => p.reviewRole === 'APPROVER').length;
  const reviewersCount = assignedParticipants.filter(p => p.reviewRole === 'REVIEWER').length;

  const participantsSummaryText = useMemo(() => {
    const parts: string[] = [];
    if (approversCount > 0) {
      parts.push(`${approversCount} approver`);
    }
    if (reviewersCount > 0) {
      parts.push(`${reviewersCount} reviewer`);
    }
    return parts.join(' và ') || '0 người tham gia';
  }, [approversCount, reviewersCount]);

  // Filter items in Step 1
  const filteredReviewItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return reviewItems;
    const q = itemSearchQuery.toLowerCase();
    return reviewItems.filter(
      i =>
        i.key.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.itemTypeKey && i.itemTypeKey.toLowerCase().includes(q)) ||
        (i.status && i.status.toLowerCase().includes(q)),
    );
  }, [reviewItems, itemSearchQuery]);

  const handleRemoveItem = (id: string) => {
    setReviewItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAllItems = () => {
    setReviewItems([]);
  };

  // Memoized IDs of currently selected review items
  const alreadySelectedItemIds = useMemo(
    () => reviewItems.map(i => i.id),
    [reviewItems],
  );

  // When items are selected from ProjectItemPickerModal
  const handleAddItemsFromTree = (newItems: ReviewWizardItemInfo[]) => {
    setReviewItems(newItems);
    setError(null);
  };

  // Deadline formatting helper for email preview
  const formatDeadlineDisplay = (dateStr: string, timeStr: string) => {
    if (!dateStr) return 'Ngày 26/10 lúc 17:00 EDT';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        return `Ngày ${day}/${month}/${year} lúc ${timeStr}`;
      }
      return `${dateStr} lúc ${timeStr}`;
    } catch {
      return `${dateStr} lúc ${timeStr}`;
    }
  };

  // Error & Mutation
  const [error, setError] = useState<string | null>(null);
  const createReviewMutation = useCreateReviewMutation();

  if (!isOpen) return null;

  const itemCount = reviewItems.length;

  // Toggle helpers for related items
  const toggleUpstreamType = (type: string) => {
    setSelectedUpstreamTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type],
    );
  };

  const toggleDownstreamType = (type: string) => {
    setSelectedDownstreamTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type],
    );
  };

  // Participant assignments manipulation
  const handleAddAssignment = (item: AvailableParticipant) => {
    if (
      assignedParticipants.some(p => p.id === item.id || (item.userId && p.userId === item.userId))
    ) {
      return;
    }
    setAssignedParticipants(prev => [
      ...prev,
      {
        id: item.id,
        userId: item.isGroup ? undefined : item.userId,
        groupId: item.isGroup ? item.id : undefined,
        name: item.name,
        email: item.email,
        avatarUrl: item.avatarUrl,
        isGroup: item.isGroup,
        signerRole: 'Not assigned',
        reviewRole: 'APPROVER',
      },
    ]);
  };

  const handleInviteByEmail = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    const cleanEmail = inviteEmail.trim();
    if (assignedParticipants.some(p => p.email?.toLowerCase() === cleanEmail.toLowerCase())) {
      setError('Email này đã được thêm vào danh sách người tham gia');
      return;
    }

    const namePart = cleanEmail.split('@')[0];
    const matchedMember = availableParticipants.find(
      p =>
        p.email?.toLowerCase() === cleanEmail.toLowerCase() ||
        p.name.toLowerCase() === namePart.toLowerCase(),
    );

    setAssignedParticipants(prev => [
      ...prev,
      {
        id: matchedMember ? matchedMember.id : `email-${Date.now()}`,
        userId: matchedMember?.userId,
        name: matchedMember?.name || namePart,
        email: cleanEmail,
        avatarUrl: matchedMember?.avatarUrl,
        signerRole: 'Not assigned',
        reviewRole: 'APPROVER',
      },
    ]);
    setInviteEmail('');
    setError(null);
  };

  const handleUpdateReviewRole = (id: string, role: 'APPROVER' | 'REVIEWER') => {
    setAssignedParticipants(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          reviewRole: role,
          signerRole: 'Not assigned',
        };
      }),
    );
  };

  const handleUpdateSignerRole = (id: string, signerRole: SignerRole) => {
    setAssignedParticipants(prev => prev.map(p => (p.id === id ? { ...p, signerRole } : p)));
  };

  const handleRemoveAssignment = (id: string) => {
    setAssignedParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleClearAllAssignments = () => {
    setAssignedParticipants([]);
  };

  const handleSubmit = async (initiateImmediately: boolean) => {
    if (!name.trim()) {
      setError('Tên review là bắt buộc');
      setStep(1);
      return;
    }

    if (reviewItems.length === 0) {
      setError('Vui lòng chọn ít nhất một item từ dự án để review');
      setStep(1);
      return;
    }

    try {
      setError(null);
      const combinedDeadline = deadlineDate ? new Date(deadlineDate).toISOString() : undefined;

      const validParticipants = assignedParticipants.filter(p => !!p.userId);
      if (validParticipants.length === 0 && assignedParticipants.length > 0) {
        setError('Các người tham gia cần phải là thành viên trong hệ thống.');
        setStep(3);
        return;
      }

      const formattedParticipants: CreateReviewParticipantInput[] = validParticipants.map(p => ({
        userId: p.userId!,
        groupId: p.groupId,
        reviewRole: p.reviewRole === 'APPROVER' ? ReviewRole.APPROVER : ReviewRole.REVIEWER,
        isSigner: false, // Signer role is disabled / undefined
      }));

      const finalItemIds = reviewItems.map(i => i.id);

      const result = await createReviewMutation.mutateAsync({
        projectId,
        name: name.trim(),
        description: invitationMessage.trim() || undefined,
        deadline: combinedDeadline,
        itemIds: finalItemIds,
        participants: formattedParticipants,
        includeContext: includeRelatedItems,
        initiateImmediately,
      });

      onClose();
      if (onSuccess && result?.id) {
        onSuccess(result.id);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Khởi tạo review thất bại');
    }
  };

  const isApproval = templateType === ReviewTemplateType.APPROVAL;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden text-slate-800">
          {/* Modal Top Header matching Jama Connect screenshots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2 bg-white">
            <h2 className="font-bold text-lg text-slate-900">Khởi tạo review</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1"
              >
                <QuestionIcon className="w-4 h-4 rounded-full" />
                <span>Tìm hiểu thêm</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stepper matching Jama Connect: 1 Định nghĩa, 2 Cài đặt, 3 Người tham gia, 4 Lời mời */}
          <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-slate-200 text-xs">
            {[
              { num: 1, label: 'Định nghĩa' },
              { num: 2, label: 'Cài đặt' },
              { num: 3, label: 'Người tham gia' },
              { num: 4, label: 'Lời mời' },
            ].map((item, idx) => (
              <React.Fragment key={item.num}>
                {idx > 0 && <div className="flex-1 max-w-[48px] h-px bg-slate-200 mx-2" />}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step === item.num
                        ? 'bg-[#203a6b] text-white'
                        : step > item.num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.num}
                  </span>
                  <span
                    className={`font-semibold ${
                      step === item.num
                        ? 'text-[#203a6b]'
                        : step > item.num
                          ? 'text-slate-800'
                          : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-8 mt-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4">
            {/* ========================================================================= */}
            {/* STEP 1: ĐỊNH NGHĨA (DEFINITION)                                           */}
            {/* ========================================================================= */}
            {step === 1 && (
              <div className="space-y-4 text-xs">
                {/* Name (With mandatory asterisk * and empty by default) */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tên review <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400"
                    placeholder="Nhập tên review (vd: System Requirements Ready for Review)..."
                  />
                  {!name.trim() && error && (
                    <p className="text-[11px] text-red-600 mt-1">Tên review là bắt buộc</p>
                  )}
                </div>

                {/* Deadline (Date + Time side by side) */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hạn chót (Deadline)</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={e => setDeadlineDate(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="relative w-40">
                      <select
                        value={deadlineTime}
                        onChange={e => setDeadlineTime(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="17:00 EDT">17:00 EDT</option>
                        <option value="09:00 EDT">09:00 EDT</option>
                        <option value="12:00 EDT">12:00 EDT</option>
                        <option value="23:59 EDT">23:59 EDT (Cuối ngày)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Project (Readonly with Search icon) */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Dự án (Project)</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={projectName || 'Review Center Demo'}
                      className="w-full text-xs px-3 py-1.5 pr-8 border border-slate-300 bg-slate-50 text-slate-700 rounded cursor-default outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2" />
                  </div>
                </div>

                {/* Items Section: Filter Info + Detailed Interactive Items List + Select from Project Button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-medium text-slate-700">
                      Các item cần review <span className="text-red-500 font-bold">*</span> (
                      {reviewItems.length})
                    </label>
                    <div className="flex items-center gap-2">
                      {sourceFilterName && (
                        <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                          Bộ lọc: {sourceFilterName}
                        </span>
                      )}

                      {/* Button to open Project Tree Item Selector Modal */}
                      <button
                        type="button"
                        onClick={() => setIsTreeModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#203a6b] hover:bg-[#162747] text-white text-[11px] font-semibold rounded shadow-2xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>
                          {reviewItems.length === 0 ? 'Chọn item từ dự án' : 'Thêm item'}
                        </span>
                      </button>

                      {reviewItems.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsItemListExpanded(!isItemListExpanded)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 ml-1"
                          >
                            <span>{isItemListExpanded ? 'Thu gọn' : 'Hiện danh sách'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isItemListExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={handleClearAllItems}
                            className="text-[11px] text-slate-400 hover:text-red-600 font-medium ml-1"
                            title="Xoá tất cả item đã chọn"
                          >
                            Xoá tất cả
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Empty state when no items selected */}
                  {reviewItems.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50 space-y-2">
                      <FolderTree className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-xs font-semibold text-slate-700">
                        Chưa có item nào được chọn
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Vui lòng chọn các item từ cây thư mục dự án hoặc bộ lọc để đưa vào review này.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsTreeModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#203a6b] hover:bg-[#162747] text-white text-xs font-semibold rounded shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Chọn item từ cây thư mục dự án</span>
                      </button>
                    </div>
                  ) : (
                    /* Detailed item list table */
                    isItemListExpanded && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs animate-in fade-in duration-100">
                        {/* Search filter within review items */}
                        <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Tìm kiếm item theo ID, tên, loại hoặc trạng thái..."
                              value={itemSearchQuery}
                              onChange={e => setItemSearchQuery(e.target.value)}
                              className="w-full text-xs px-2.5 py-1 pr-7 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1.5 pointer-events-none" />
                          </div>
                          <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                            Hiển thị {filteredReviewItems.length} trên tổng số {reviewItems.length} item
                          </span>
                        </div>

                        {/* Items Table */}
                        <div className="max-h-52 overflow-y-auto">
                          {filteredReviewItems.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                              Không tìm thấy item phù hợp.
                            </div>
                          ) : (
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-[#f8f9fa] text-slate-600 border-b border-slate-200 font-semibold sticky top-0">
                                <tr>
                                  <th className="py-1.5 px-3 w-28">ID</th>
                                  <th className="py-1.5 px-3">Tên item</th>
                                  <th className="py-1.5 px-3 w-24">Loại (Type)</th>
                                  <th className="py-1.5 px-3 w-28">Trạng thái (Status)</th>
                                  <th className="py-1.5 px-3 w-16 text-center">Phiên bản</th>
                                  <th className="py-1.5 px-2 w-10 text-center"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredReviewItems.map(item => (
                                  <tr
                                    key={item.id}
                                    className="hover:bg-blue-50/40 transition-colors group"
                                  >
                                    <td className="py-1.5 px-3 font-mono font-bold text-blue-600 text-[11px]">
                                      {item.key}
                                    </td>
                                    <td
                                      className="py-1.5 px-3 font-medium text-slate-800 truncate max-w-[280px]"
                                      title={item.name}
                                    >
                                      {item.name}
                                    </td>
                                    <td className="py-1.5 px-3">
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                          item.itemTypeKey === 'SET'
                                            ? 'bg-purple-100 text-purple-800'
                                            : item.itemTypeKey === 'TXT'
                                              ? 'bg-slate-100 text-slate-700'
                                              : item.itemTypeKey === 'DEFECT'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}
                                      >
                                        {item.itemTypeKey || 'REQ'}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-3">
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                          item.status === 'Accepted'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : item.status === 'In Review'
                                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                      >
                                        {item.status || 'In Review'}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                                      v{item.currentVersion || 1}
                                    </td>
                                    <td className="py-1.5 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-slate-300 group-hover:text-red-600 p-0.5 transition-colors"
                                        title="Xoá item khỏi review"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Checkboxes: Attachments & Related Items */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="attachments"
                      checked={includeAttachments}
                      onChange={e => setIncludeAttachments(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="attachments" className="text-slate-700 cursor-pointer">
                      Đính kèm tệp của item (Reviewer cần có quyền dự án phù hợp để xem tệp đính kèm.)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="relatedItems"
                      checked={includeRelatedItems}
                      onChange={e => setIncludeRelatedItems(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="relatedItems" className="text-slate-700 cursor-pointer">
                      Bao gồm các item liên quan (Related items)
                    </label>
                  </div>
                </div>

                {/* Expandable Section: When 'Include related items' is checked */}
                {includeRelatedItems && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 animate-in fade-in duration-150">
                    <h4 className="font-semibold text-slate-800 text-xs">
                      Chọn các item liên quan để hiển thị trong review này
                    </h4>

                    {/* Upstream Items */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showUpstream"
                          checked={showUpstream}
                          onChange={e => setShowUpstream(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <label
                          htmlFor="showUpstream"
                          className="font-medium text-slate-800 cursor-pointer"
                        >
                          Hiển thị các item liên quan upstream
                        </label>
                      </div>

                      {showUpstream && (
                        <div className="pl-6 space-y-1.5 text-[11px] text-slate-600">
                          {[
                            { label: 'FMEA liên quan', count: 2, icon: '🔨' },
                            { label: 'Phân tích mối nguy sơ bộ liên quan', count: 1, icon: '📄' },
                            { label: 'Đánh giá rủi ro liên quan', count: 1, icon: '☣️' },
                            { label: 'User Needs liên quan', count: 10, icon: '👥' },
                            { label: 'xFMEA liên quan', count: 1, icon: '📑' },
                          ].map(rel => (
                            <div
                              key={rel.label}
                              className="flex items-center justify-between py-0.5"
                            >
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedUpstreamTypes.includes(rel.label)}
                                  onChange={() => toggleUpstreamType(rel.label)}
                                  className="rounded text-blue-600"
                                />
                                <span>{rel.icon}</span>
                                <span className="font-medium text-slate-800">{rel.label}</span>
                                <span className="text-slate-400">{rel.count} item</span>
                              </label>
                              <button
                                type="button"
                                className="text-blue-600 hover:underline flex items-center text-[11px]"
                              >
                                Hiện bộ lọc <ChevronRight className="w-3 h-3 ml-0.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Downstream Items */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showDownstream"
                          checked={showDownstream}
                          onChange={e => setShowDownstream(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <label
                          htmlFor="showDownstream"
                          className="font-medium text-slate-800 cursor-pointer"
                        >
                          Hiển thị các item liên quan downstream
                        </label>
                      </div>

                      {showDownstream && (
                        <div className="pl-6 space-y-1.5 text-[11px] text-slate-600">
                          {[
                            { label: 'Subsystem Requirements liên quan', count: 12, icon: '💻' },
                            { label: 'System Architectures liên quan', count: 8, icon: '🧩' },
                            { label: 'Verifications liên quan', count: 5, icon: '✔️' },
                          ].map(rel => (
                            <div
                              key={rel.label}
                              className="flex items-center justify-between py-0.5"
                            >
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDownstreamTypes.includes(rel.label)}
                                  onChange={() => toggleDownstreamType(rel.label)}
                                  className="rounded text-blue-600"
                                />
                                <span>{rel.icon}</span>
                                <span className="font-medium text-slate-800">{rel.label}</span>
                                <span className="text-slate-400">{rel.count} item</span>
                              </label>
                              <button
                                type="button"
                                className="text-blue-600 hover:underline flex items-center text-[11px]"
                              >
                                Hiện bộ lọc <ChevronRight className="w-3 h-3 ml-0.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: CÀI ĐẶT (SETTINGS)                                                */}
            {/* ========================================================================= */}
            {step === 2 && (
              <div className="space-y-5 text-xs">
                {/* Review template selection */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Review template</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Approval review Card */}
                    <div
                      onClick={() => setTemplateType(ReviewTemplateType.APPROVAL)}
                      className={`cursor-pointer p-3 border rounded-lg transition-all flex items-start gap-3 ${
                        isApproval
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reviewTemplate"
                        checked={isApproval}
                        onChange={() => setTemplateType(ReviewTemplateType.APPROVAL)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Approval review</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cài đặt chỉ đọc (read-only), được cấu hình trong Review Center admin.
                        </p>
                      </div>
                    </div>

                    {/* Peer review Card */}
                    <div
                      onClick={() => setTemplateType(ReviewTemplateType.PEER)}
                      className={`cursor-pointer p-3 border rounded-lg transition-all flex items-start gap-3 ${
                        !isApproval
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reviewTemplate"
                        checked={!isApproval}
                        onChange={() => setTemplateType(ReviewTemplateType.PEER)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Peer review</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cài đặt có thể tuỳ chỉnh, được cấu hình trong Review Center admin.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Electronic signature settings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-700">Cài đặt Electronic signature</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                      Chưa định nghĩa (Disabled)
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    <label className="flex items-center gap-2 text-slate-400 cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={false}
                        disabled={true}
                        className="rounded text-slate-400 disabled:opacity-50 cursor-not-allowed"
                      />
                      <span>Yêu cầu electronic signature từ approver (Chưa định nghĩa)</span>
                    </label>

                    <label className="flex items-center gap-2 pl-6 text-slate-400 cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={false}
                        disabled={true}
                        className="rounded text-slate-400 disabled:opacity-50 cursor-not-allowed"
                      />
                      <span>
                        Bật signer role cho approver. Gắn vai trò người ký với chữ ký của approver. (Chưa định nghĩa)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Permission settings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-700">Cài đặt quyền hạn (Permissions)</h4>
                  <div className="space-y-1.5 pl-1">
                    <label
                      className={`flex items-center gap-2 ${
                        isApproval
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : allowCommentsInProject}
                        disabled={isApproval}
                        onChange={e => setAllowCommentsInProject(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>
                        Cho phép comment trong review hiển thị ở single item view trong project
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : allowApproversAddParticipants}
                        disabled={isApproval}
                        onChange={e => setAllowApproversAddParticipants(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Cho phép approver thêm reviewer và approver</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : allowApproversDelegate}
                        disabled={isApproval}
                        onChange={e => setAllowApproversDelegate(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Cho phép approver uỷ quyền (delegate) review cho người khác</span>
                    </label>
                  </div>
                </div>

                {/* Optional settings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-700">Cài đặt tuỳ chọn (Optional settings)</h4>
                  <div className="space-y-1.5 pl-1">
                    <label
                      className={`flex items-center gap-2 ${
                        isApproval
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : enableTimeTracking}
                        disabled={isApproval}
                        onChange={e => setEnableTimeTracking(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Bật theo dõi thời gian (time tracking)</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? false : notifyParticipantFinishes}
                        disabled={isApproval}
                        onChange={e => setNotifyParticipantFinishes(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Thông báo khi người tham gia (participant) hoàn thành review</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? false : enableVoting}
                        disabled={isApproval}
                        onChange={e => setEnableVoting(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Bật bình chọn (voting)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: NGƯỜI THAM GIA (PARTICIPANTS)                                      */}
            {/* ========================================================================= */}
            {step === 3 && (
              <div className="flex flex-col text-xs space-y-3">
                {/* Dual-Column Header matching media_1789105342448.png */}
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs w-[280px]">
                    Chọn người tham gia
                  </h3>
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold">
                    ➔
                  </div>
                  <div className="flex-1 flex items-center justify-between pl-2">
                    <h3 className="font-bold text-slate-900 text-xs">Phân công vai trò (Assignments)</h3>
                    {assignedParticipants.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllAssignments}
                        className="text-blue-600 hover:underline text-[11px] font-medium"
                      >
                        Xoá tất cả người tham gia
                      </button>
                    )}
                  </div>
                </div>

                {/* Dual Column Body */}
                <div className="flex gap-4 min-h-[340px]">
                  {/* Left Column: Select participants */}
                  <div className="w-[280px] flex flex-col border-r border-slate-200 pr-3 flex-shrink-0">
                    {/* Tabs: Project team | Invite by email */}
                    <div className="flex items-center border-b border-slate-200 mb-2.5">
                      <button
                        type="button"
                        onClick={() => setParticipantTab('team')}
                        className={`pb-1.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
                          participantTab === 'team'
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Nhóm dự án (Project team)
                      </button>
                      <button
                        type="button"
                        onClick={() => setParticipantTab('email')}
                        className={`pb-1.5 px-2 text-xs font-semibold border-b-2 transition-colors ${
                          participantTab === 'email'
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Mời qua email
                      </button>
                    </div>

                    {participantTab === 'team' ? (
                      <>
                        {/* Search box with magnifying glass */}
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Tìm theo email hoặc tên..."
                            value={searchParticipant}
                            onChange={e => setSearchParticipant(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 pr-7 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                        </div>

                        {/* Participant & Group list */}
                        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 max-h-[290px]">
                          {filteredAvailable.map(item => {
                            const isAssigned = assignedParticipants.some(p => p.id === item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => !isAssigned && handleAddAssignment(item)}
                                className={`flex items-center gap-2.5 p-1.5 rounded text-xs transition-colors ${
                                  isAssigned
                                    ? 'opacity-40 cursor-default bg-slate-50'
                                    : 'hover:bg-blue-50/70 cursor-pointer text-slate-800'
                                }`}
                              >
                                {item.avatarUrl ? (
                                  <img
                                    src={item.avatarUrl}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : item.isGroup ? (
                                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <Users className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-xs text-slate-900 truncate">
                                    {item.name}
                                  </div>
                                  {item.isGroup && (
                                    <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                                      Tổ chức (Organization)
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      /* Invite by email tab */
                      <div className="space-y-3 pt-1">
                        <p className="text-[11px] text-slate-500">
                          Mời thành viên bên ngoài bằng cách nhập địa chỉ email của họ.
                        </p>
                        <input
                          type="email"
                          placeholder="user@example.com"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleInviteByEmail()}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleInviteByEmail}
                          className="w-full py-1.5 bg-[#203a6b] hover:bg-[#162747] text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm vào danh sách phân công</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Select assignments */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 pb-2 text-[11px] font-semibold text-slate-700 border-b border-slate-100 px-1">
                      <div className="col-span-5">Người tham gia (Participant)</div>
                      <div className="col-span-3">Signer role</div>
                      <div className="col-span-3">Review role</div>
                      <div className="col-span-1 text-right"></div>
                    </div>

                    {/* Table Rows */}
                    {assignedParticipants.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400 italic">
                        Chưa có người tham gia nào. Vui lòng chọn thành viên nhóm ở cột bên trái.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
                        {assignedParticipants.map(p => (
                          <div
                            key={p.id}
                            className="grid grid-cols-12 gap-2 py-2 items-center text-xs px-1"
                          >
                            {/* Participant Name & Avatar */}
                            <div className="col-span-5 flex items-center gap-2 min-w-0">
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <span
                                className="font-medium text-slate-900 truncate text-xs"
                                title={p.name}
                              >
                                {p.name}
                              </span>
                            </div>

                            {/* Signer role Dropdown - Disabled because not defined */}
                            <div className="col-span-3">
                              <div className="relative">
                                <select
                                  value="Chưa định nghĩa"
                                  disabled={true}
                                  title="Signer role chưa được định nghĩa trong hệ thống"
                                  className="w-full text-xs px-2 py-1 pr-6 border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed rounded outline-none appearance-none font-normal"
                                >
                                  <option value="Chưa định nghĩa">Chưa định nghĩa</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-300 absolute right-2 top-2 pointer-events-none" />
                              </div>
                            </div>

                            {/* Review role Radios */}
                            <div className="col-span-3 flex items-center gap-3">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                                <input
                                  type="radio"
                                  name={`role-${p.id}`}
                                  checked={p.reviewRole === 'APPROVER'}
                                  onChange={() => handleUpdateReviewRole(p.id, 'APPROVER')}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Approver</span>
                              </label>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                                <input
                                  type="radio"
                                  name={`role-${p.id}`}
                                  checked={p.reviewRole === 'REVIEWER'}
                                  onChange={() => handleUpdateReviewRole(p.id, 'REVIEWER')}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Reviewer</span>
                              </label>
                            </div>

                            {/* Remove button */}
                            <div className="col-span-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignment(p.id)}
                                className="text-slate-300 hover:text-red-500 p-1 transition-colors rounded inline-flex items-center"
                                title="Xoá người tham gia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: LỜI MỜI (INVITATION)                                              */}
            {/* ========================================================================= */}
            {step === 4 && (
              <div className="space-y-4 text-xs">
                {/* Participants summary */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Người tham gia (Participants)</label>
                  <input
                    type="text"
                    readOnly
                    value={participantsSummaryText}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 bg-slate-50 text-slate-700 rounded outline-none cursor-default"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tiêu đề email (Subject)</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => {
                      setSubject(e.target.value);
                      setIsSubjectDirty(true);
                    }}
                    placeholder="Tiêu đề thư mời tham gia review..."
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nội dung thư (Message)</label>
                  <textarea
                    rows={3}
                    value={invitationMessage}
                    onChange={e => {
                      setInvitationMessage(e.target.value);
                      setIsMessageDirty(true);
                    }}
                    placeholder="Tin nhắn tuỳ chỉnh gửi đến các người tham gia review..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Items summary preview */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-700">
                      Các item đưa vào review ({reviewItems.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sẽ được lưu snapshot vào Review Baseline (v1)
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2 max-h-24 overflow-y-auto space-y-1">
                    {reviewItems.slice(0, 10).map(item => (
                      <div key={item.id} className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-blue-600 truncate max-w-xs">
                          {item.key}: {item.name}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {item.itemTypeKey || 'REQ'} • {item.status || 'In Review'}
                        </span>
                      </div>
                    ))}
                    {reviewItems.length > 10 && (
                      <div className="text-[10px] text-slate-400 italic pt-0.5 text-center">
                        ...và thêm {reviewItems.length - 10} item khác
                      </div>
                    )}
                  </div>
                </div>

                {/* Email preview matching screenshot */}
                <div className="pt-2 text-xs text-slate-700 space-y-3 font-sans leading-relaxed border-t border-slate-100">
                  <div>
                    Vai trò review của bạn là:{' '}
                    <span className="text-slate-500 font-mono text-[11px]">
                      *&#91; review role &#93;*
                    </span>
                  </div>

                  <div className="text-slate-500 text-[11px] italic">
                    *&#91; Nếu người tham gia là approver &#93;*
                  </div>

                  <div className="pl-3 border-l-2 border-slate-200 space-y-1 text-slate-500 text-xs italic">
                    <div>* Signer role: Chưa được kích hoạt trong hệ thống *</div>
                  </div>

                  <div className="pt-1 text-blue-600 text-xs break-all hover:underline cursor-pointer">
                    https://al-jama.connect.cloud/review#/r:REV-??
                  </div>

                  <div className="text-xs text-slate-700">
                    Hạn chót:{' '}
                    <span className="font-medium">
                      {formatDeadlineDisplay(deadlineDate, deadlineTime)}
                    </span>
                  </div>

                  <div className="pt-2 text-xs text-slate-700">
                    <p>Trân trọng,</p>
                    <p className="font-medium text-slate-900">
                      {currentUser?.fullName || 'Người điều phối review'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Bottom Footer matching Jama Connect screenshots */}
          <div className="flex items-center justify-between px-8 py-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 transition-colors shadow-sm"
                >
                  Quay lại
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 transition-colors shadow-sm"
                >
                  Huỷ
                </button>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {itemCount} item | {assignedParticipants.length} người tham gia
              </span>
            </div>

            <div className="flex items-center gap-2">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1) {
                      if (!name.trim()) {
                        setError('Vui lòng nhập tên review (bắt buộc)');
                        return;
                      }
                      if (reviewItems.length === 0) {
                        setError('Vui lòng chọn ít nhất một item từ dự án để review');
                        return;
                      }
                    }
                    setError(null);
                    setStep((step + 1) as 1 | 2 | 3 | 4);
                  }}
                  className="px-6 py-1.5 text-xs font-semibold text-white bg-[#203a6b] hover:bg-[#162747] rounded shadow-sm transition-colors"
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  type="button"
                  disabled={createReviewMutation.isPending}
                  onClick={() => handleSubmit(true)}
                  className="px-6 py-1.5 text-xs font-semibold text-white bg-[#203a6b] hover:bg-[#162747] rounded shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>
                    {createReviewMutation.isPending ? 'Đang khởi tạo...' : 'Khởi tạo review'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Item Picker Modal */}
      {isTreeModalOpen && (
        <ProjectItemPickerModal
          isOpen={isTreeModalOpen}
          onClose={() => setIsTreeModalOpen(false)}
          projectId={projectId}
          projectName={projectName}
          alreadySelectedItemIds={alreadySelectedItemIds}
          onSelectItems={handleAddItemsFromTree}
        />
      )}
    </>
  );
};
