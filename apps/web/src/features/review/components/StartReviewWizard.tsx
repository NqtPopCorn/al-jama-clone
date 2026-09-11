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
import {
  ReviewRole,
  ReviewTemplateType,
  CreateReviewParticipantInput,
} from '@aljama/shared';
import { useAuthStore } from '../../../stores/auth.store';
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
  avatarUrl?: string;
  isGroup?: boolean;
  subtitle?: string;
}

interface AssignedParticipant {
  id: string;
  userId?: string;
  groupId?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  isGroup?: boolean;
  signerRole: SignerRole;
  reviewRole: 'APPROVER' | 'REVIEWER';
}

const DEFAULT_AVAILABLE: AvailableParticipant[] = [
  {
    id: 'u-carleda',
    name: 'Carleda Wade',
    email: 'carleda.wade@jamacloud.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isGroup: false,
  },
  { id: 'u-joe', name: 'Joe Johnson', email: 'joe.johnson@jamacloud.com', isGroup: false },
  { id: 'u-liam', name: 'Liam Rotchford', email: 'liam.rotchford@jamacloud.com', isGroup: false },
  { id: 'g-org-admin', name: 'Organization Admin', subtitle: 'Organization', isGroup: true },
  { id: 'g-proj-admin', name: 'Project Admin', subtitle: 'Organization', isGroup: true },
  { id: 'g-quality', name: 'Quality', subtitle: 'Organization', isGroup: true },
  { id: 'g-rd', name: 'R&D', subtitle: 'Organization', isGroup: true },
  {
    id: 'u-rebecca',
    name: 'Rebecca Requirements Writer',
    email: 'rebecca@jamacloud.com',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isGroup: false,
  },
  {
    id: 'u-sarah',
    name: 'Sarah Approver',
    email: 'sarah.approver@jamacloud.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isGroup: false,
  },
  { id: 'u-steve', name: 'Steve Bush', email: 'steve.bush@jamacloud.com', isGroup: false },
];

interface StartReviewWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  preselectedItemIds?: string[];
  initialItems?: ReviewWizardItemInfo[];
  defaultReviewName?: string;
  sourceFilterName?: string;
  members?: Array<{ userId: string; fullName: string; username: string }>;
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
  const currentUser = useAuthStore((s) => s.user);
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
      setSubject(
        defaultReviewName ? `Jama-Carleda Wade REVIEW: ${defaultReviewName}` : '',
      );
      setInvitationMessage(
        defaultReviewName
          ? `You are invited to the following review of ${defaultReviewName}. Select the link below to begin the review and leave feedback.`
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
  const [templateType, setTemplateType] = useState<ReviewTemplateType>(
    ReviewTemplateType.APPROVAL,
  );

  const [requireSignature, setRequireSignature] = useState(false);
  const [enableSignerRole, setEnableSignerRole] = useState(false);
  const [allowCommentsInProject, setAllowCommentsInProject] = useState(true);
  const [allowApproversAddParticipants, setAllowApproversAddParticipants] = useState(true);
  const [allowApproversDelegate, setAllowApproversDelegate] = useState(false);
  const [enableTimeTracking, setEnableTimeTracking] = useState(true);
  const [notifyParticipantFinishes, setNotifyParticipantFinishes] = useState(false);
  const [enableVoting, setEnableVoting] = useState(false);

  // --- Step 3: Participants State (Khớp media_1789105342448.png) ---
  const [participantTab, setParticipantTab] = useState<'team' | 'email'>('team');
  const [searchParticipant, setSearchParticipant] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Initial assignments matching Jama Connect screenshot
  const [assignedParticipants, setAssignedParticipants] = useState<AssignedParticipant[]>([
    {
      id: 'u-carleda',
      userId: members[0]?.userId,
      name: 'Carleda Wade',
      email: 'carleda.wade@jamacloud.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      signerRole: 'Regulatory',
      reviewRole: 'APPROVER',
    },
    {
      id: 'u-joe',
      userId: members[1]?.userId,
      name: 'Joe Johnson',
      email: 'joe.johnson@jamacloud.com',
      signerRole: 'R&D',
      reviewRole: 'APPROVER',
    },
    {
      id: 'u-rebecca',
      userId: members[2]?.userId,
      name: 'Rebecca Requirements Writer',
      email: 'rebecca@jamacloud.com',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      signerRole: 'Not assigned',
      reviewRole: 'APPROVER',
    },
  ]);

  // Combine default list with project members
  const availableParticipants = useMemo(() => {
    const list: AvailableParticipant[] = [...DEFAULT_AVAILABLE];
    if (members && members.length > 0) {
      members.forEach((m) => {
        if (!list.some((item) => item.userId === m.userId || item.name === m.fullName)) {
          list.push({
            id: m.userId,
            userId: m.userId,
            name: m.fullName,
            email: `${m.username}@jamacloud.com`,
            isGroup: false,
          });
        }
      });
    }
    return list;
  }, [members]);

  const filteredAvailable = useMemo(() => {
    if (!searchParticipant.trim()) return availableParticipants;
    const q = searchParticipant.toLowerCase();
    return availableParticipants.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)),
    );
  }, [availableParticipants, searchParticipant]);

  // --- Step 4: Invitation State ---
  const [subject, setSubject] = useState(
    defaultReviewName ? `Jama-Carleda Wade REVIEW: ${defaultReviewName}` : '',
  );
  const [isSubjectDirty, setIsSubjectDirty] = useState(false);

  const [invitationMessage, setInvitationMessage] = useState(
    defaultReviewName
      ? `You are invited to the following review of ${defaultReviewName}. Select the link below to begin the review and leave feedback.`
      : '',
  );
  const [isMessageDirty, setIsMessageDirty] = useState(false);

  // Sync subject and message when review name changes in Step 1
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!isSubjectDirty) {
      setSubject(newName.trim() ? `Jama-Carleda Wade REVIEW: ${newName}` : '');
    }
    if (!isMessageDirty) {
      setInvitationMessage(
        newName.trim()
          ? `You are invited to the following review of ${newName}. Select the link below to begin the review and leave feedback.`
          : '',
      );
    }
  };

  // Participant counts summary for Step 4
  const approversCount = assignedParticipants.filter((p) => p.reviewRole === 'APPROVER').length;
  const reviewersCount = assignedParticipants.filter((p) => p.reviewRole === 'REVIEWER').length;

  const participantsSummaryText = useMemo(() => {
    const parts: string[] = [];
    if (approversCount > 0) {
      parts.push(`${approversCount} ${approversCount === 1 ? 'approver' : 'approvers'}`);
    }
    if (reviewersCount > 0) {
      parts.push(`${reviewersCount} ${reviewersCount === 1 ? 'reviewer' : 'reviewers'}`);
    }
    return parts.join(' and ') || '0 participants';
  }, [approversCount, reviewersCount]);

  // Filter items in Step 1
  const filteredReviewItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return reviewItems;
    const q = itemSearchQuery.toLowerCase();
    return reviewItems.filter(
      (i) =>
        i.key.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.itemTypeKey && i.itemTypeKey.toLowerCase().includes(q)) ||
        (i.status && i.status.toLowerCase().includes(q)),
    );
  }, [reviewItems, itemSearchQuery]);

  const handleRemoveItem = (id: string) => {
    setReviewItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAllItems = () => {
    setReviewItems([]);
  };

  // When items are selected from ProjectItemPickerModal
  const handleAddItemsFromTree = (newItems: ReviewWizardItemInfo[]) => {
    setReviewItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const filteredNew = newItems.filter((i) => !existingIds.has(i.id));
      return [...prev, ...filteredNew];
    });
    setError(null);
  };

  // Deadline formatting helper for email preview
  const formatDeadlineDisplay = (dateStr: string, timeStr: string) => {
    if (!dateStr) return 'Wednesday, Oct 26th at 17:00 EDT';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const nth = (n: number) => {
          if (n > 3 && n < 21) return 'th';
          switch (n % 10) {
            case 1:
              return 'st';
            case 2:
              return 'nd';
            case 3:
              return 'rd';
            default:
              return 'th';
          }
        };
        return `${dayName}, ${monthName} ${day}${nth(day)} at ${timeStr}`;
      }
      return `${dateStr} at ${timeStr}`;
    } catch {
      return `${dateStr} at ${timeStr}`;
    }
  };

  // Error & Mutation
  const [error, setError] = useState<string | null>(null);
  const createReviewMutation = useCreateReviewMutation();

  if (!isOpen) return null;

  const itemCount = reviewItems.length;

  // Toggle helpers for related items
  const toggleUpstreamType = (type: string) => {
    setSelectedUpstreamTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleDownstreamType = (type: string) => {
    setSelectedDownstreamTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  // Participant assignments manipulation
  const handleAddAssignment = (item: AvailableParticipant) => {
    if (
      assignedParticipants.some(
        (p) => p.id === item.id || (item.userId && p.userId === item.userId),
      )
    ) {
      return;
    }
    setAssignedParticipants((prev) => [
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
      setError('Please enter a valid email address');
      return;
    }
    const cleanEmail = inviteEmail.trim();
    if (assignedParticipants.some((p) => p.email?.toLowerCase() === cleanEmail.toLowerCase())) {
      setError('This email is already added as a participant');
      return;
    }

    const newId = `email-${Date.now()}`;
    const namePart = cleanEmail.split('@')[0];
    setAssignedParticipants((prev) => [
      ...prev,
      {
        id: newId,
        name: namePart,
        email: cleanEmail,
        signerRole: 'Not assigned',
        reviewRole: 'APPROVER',
      },
    ]);
    setInviteEmail('');
    setError(null);
  };

  const handleUpdateReviewRole = (id: string, role: 'APPROVER' | 'REVIEWER') => {
    setAssignedParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          reviewRole: role,
          signerRole: role === 'REVIEWER' ? 'Not assigned' : p.signerRole,
        };
      }),
    );
  };

  const handleUpdateSignerRole = (id: string, signerRole: SignerRole) => {
    setAssignedParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, signerRole } : p)),
    );
  };

  const handleRemoveAssignment = (id: string) => {
    setAssignedParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAllAssignments = () => {
    setAssignedParticipants([]);
  };

  const handleSubmit = async (initiateImmediately: boolean) => {
    if (!name.trim()) {
      setError('Review name is required');
      setStep(1);
      return;
    }

    if (reviewItems.length === 0) {
      setError('Please select at least one item from the project to review');
      setStep(1);
      return;
    }

    try {
      setError(null);
      const combinedDeadline = deadlineDate ? new Date(deadlineDate).toISOString() : undefined;

      const formattedParticipants: CreateReviewParticipantInput[] = assignedParticipants.map((p) => ({
        userId: p.userId,
        groupId: p.groupId,
        reviewRole: p.reviewRole === 'APPROVER' ? ReviewRole.APPROVER : ReviewRole.REVIEWER,
        isSigner: p.signerRole !== 'Not assigned',
      }));

      const finalItemIds = reviewItems.map((i) => i.id);

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
      setError(e.response?.data?.message || e.message || 'Failed to initiate review');
    }
  };

  const isApproval = templateType === ReviewTemplateType.APPROVAL;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden text-slate-800">
          {/* Modal Top Header matching Jama Connect screenshots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2 bg-white">
            <h2 className="font-bold text-lg text-slate-900">Initiate review</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1"
              >
                <QuestionIcon className="w-4 h-4 rounded-full" />
                <span>Learn more</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stepper matching Jama Connect: 1 Definition, 2 Settings, 3 Participants, 4 Invitation */}
          <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-slate-200 text-xs">
            {[
              { num: 1, label: 'Definition' },
              { num: 2, label: 'Settings' },
              { num: 3, label: 'Participants' },
              { num: 4, label: 'Invitation' },
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
            {/* STEP 1: DEFINITION                                                        */}
            {/* ========================================================================= */}
            {step === 1 && (
              <div className="space-y-4 text-xs">
                {/* Name (With mandatory asterisk * and empty by default) */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400"
                    placeholder="Enter review name (e.g. System Requirements Ready for Review)..."
                  />
                  {!name.trim() && error && (
                    <p className="text-[11px] text-red-600 mt-1">Review name is required</p>
                  )}
                </div>

                {/* Deadline (Date + Time side by side) */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Deadline</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="relative w-36">
                      <select
                        value={deadlineTime}
                        onChange={(e) => setDeadlineTime(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="17:00 EDT">17:00 EDT</option>
                        <option value="09:00 EDT">09:00 EDT</option>
                        <option value="12:00 EDT">12:00 EDT</option>
                        <option value="23:59 EDT">23:59 (End of day)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Project (Readonly with Search icon) */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Project</label>
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
                      Items for Review <span className="text-red-500 font-bold">*</span> ({reviewItems.length})
                    </label>
                    <div className="flex items-center gap-2">
                      {sourceFilterName && (
                        <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                          Filter: {sourceFilterName}
                        </span>
                      )}

                      {/* Button to open Project Tree Item Selector Modal */}
                      <button
                        type="button"
                        onClick={() => setIsTreeModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#203a6b] hover:bg-[#162747] text-white text-[11px] font-semibold rounded shadow-2xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{reviewItems.length === 0 ? 'Select items from project' : 'Add items'}</span>
                      </button>

                      {reviewItems.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsItemListExpanded(!isItemListExpanded)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 ml-1"
                          >
                            <span>{isItemListExpanded ? 'Hide' : 'Show list'}</span>
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
                            title="Clear all selected items"
                          >
                            Clear all
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Empty state when no items selected */}
                  {reviewItems.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50 space-y-2">
                      <FolderTree className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-xs font-semibold text-slate-700">No items selected yet</div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Please select items from the project tree or filter to include in this review.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsTreeModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#203a6b] hover:bg-[#162747] text-white text-xs font-semibold rounded shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Select items from project tree</span>
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
                              placeholder="Search items by ID, name, type, or status..."
                              value={itemSearchQuery}
                              onChange={(e) => setItemSearchQuery(e.target.value)}
                              className="w-full text-xs px-2.5 py-1 pr-7 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1.5 pointer-events-none" />
                          </div>
                          <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                            Showing {filteredReviewItems.length} of {reviewItems.length} items
                          </span>
                        </div>

                        {/* Items Table */}
                        <div className="max-h-52 overflow-y-auto">
                          {filteredReviewItems.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                              No items match your search.
                            </div>
                          ) : (
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-[#f8f9fa] text-slate-600 border-b border-slate-200 font-semibold sticky top-0">
                                <tr>
                                  <th className="py-1.5 px-3 w-28">ID</th>
                                  <th className="py-1.5 px-3">Name</th>
                                  <th className="py-1.5 px-3 w-24">Type</th>
                                  <th className="py-1.5 px-3 w-28">Status</th>
                                  <th className="py-1.5 px-3 w-16 text-center">Version</th>
                                  <th className="py-1.5 px-2 w-10 text-center"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredReviewItems.map((item) => (
                                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
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
                                        title="Remove item from review"
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
                      onChange={(e) => setIncludeAttachments(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="attachments" className="text-slate-700 cursor-pointer">
                      Include item attachments (Reviewers must have proper project permissions to view attachments.)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="relatedItems"
                      checked={includeRelatedItems}
                      onChange={(e) => setIncludeRelatedItems(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="relatedItems" className="text-slate-700 cursor-pointer">
                      Include related items
                    </label>
                  </div>
                </div>

                {/* Expandable Section: When 'Include related items' is checked */}
                {includeRelatedItems && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 animate-in fade-in duration-150">
                    <h4 className="font-semibold text-slate-800 text-xs">
                      Select related items to show in this review
                    </h4>

                    {/* Upstream Items */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showUpstream"
                          checked={showUpstream}
                          onChange={(e) => setShowUpstream(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <label htmlFor="showUpstream" className="font-medium text-slate-800 cursor-pointer">
                          Show upstream related items
                        </label>
                      </div>

                      {showUpstream && (
                        <div className="pl-6 space-y-1.5 text-[11px] text-slate-600">
                          {[
                            { label: 'Related FMEAs', count: 2, icon: '🔨' },
                            { label: 'Related Preliminary Hazard Analyses', count: 1, icon: '📄' },
                            { label: 'Related Risk Evaluations', count: 1, icon: '☣️' },
                            { label: 'Related User Needs', count: 10, icon: '👥' },
                            { label: 'Related xFMEAs', count: 1, icon: '📑' },
                          ].map((rel) => (
                            <div key={rel.label} className="flex items-center justify-between py-0.5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedUpstreamTypes.includes(rel.label)}
                                  onChange={() => toggleUpstreamType(rel.label)}
                                  className="rounded text-blue-600"
                                />
                                <span>{rel.icon}</span>
                                <span className="font-medium text-slate-800">{rel.label}</span>
                                <span className="text-slate-400">{rel.count} items</span>
                              </label>
                              <button
                                type="button"
                                className="text-blue-600 hover:underline flex items-center text-[11px]"
                              >
                                Show filters <ChevronRight className="w-3 h-3 ml-0.5" />
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
                          onChange={(e) => setShowDownstream(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <label htmlFor="showDownstream" className="font-medium text-slate-800 cursor-pointer">
                          Show downstream related items
                        </label>
                      </div>

                      {showDownstream && (
                        <div className="pl-6 space-y-1.5 text-[11px] text-slate-600">
                          {[
                            { label: 'Related Subsystem Requirements', count: 12, icon: '💻' },
                            { label: 'Related System Architectures', count: 8, icon: '🧩' },
                            { label: 'Related Verifications', count: 5, icon: '✔️' },
                          ].map((rel) => (
                            <div key={rel.label} className="flex items-center justify-between py-0.5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDownstreamTypes.includes(rel.label)}
                                  onChange={() => toggleDownstreamType(rel.label)}
                                  className="rounded text-blue-600"
                                />
                                <span>{rel.icon}</span>
                                <span className="font-medium text-slate-800">{rel.label}</span>
                                <span className="text-slate-400">{rel.count} items</span>
                              </label>
                              <button
                                type="button"
                                className="text-blue-600 hover:underline flex items-center text-[11px]"
                              >
                                Show filters <ChevronRight className="w-3 h-3 ml-0.5" />
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
            {/* STEP 2: SETTINGS                                                          */}
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
                          Read-only settings, configured in Review center admin.
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
                          Customizable settings, configured in Review center admin.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Electronic signature settings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-700">Electronic signature settings</h4>
                  <div className="space-y-1.5 pl-1">
                    <label
                      className={`flex items-center gap-2 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : requireSignature}
                        disabled={isApproval}
                        onChange={(e) => setRequireSignature(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Require electronic signatures from approvers</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 pl-6 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : enableSignerRole}
                        disabled={isApproval}
                        onChange={(e) => setEnableSignerRole(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>
                        Enable signer role for approvers. This associates a signer role with an approver's signature.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Permission settings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-700">Permission settings</h4>
                  <div className="space-y-1.5 pl-1">
                    <label
                      className={`flex items-center gap-2 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : allowCommentsInProject}
                        disabled={isApproval}
                        onChange={(e) => setAllowCommentsInProject(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Allow for review comments to also appear in the single item view within a project</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : allowApproversAddParticipants}
                        disabled={isApproval}
                        onChange={(e) => setAllowApproversAddParticipants(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Let approvers add reviewers and approvers</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : allowApproversDelegate}
                        disabled={isApproval}
                        onChange={(e) => setAllowApproversDelegate(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Let approvers delegate their review to others</span>
                    </label>
                  </div>
                </div>

                {/* Optional settings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-700">Optional settings</h4>
                  <div className="space-y-1.5 pl-1">
                    <label
                      className={`flex items-center gap-2 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? true : enableTimeTracking}
                        disabled={isApproval}
                        onChange={(e) => setEnableTimeTracking(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Enable time tracking</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? false : notifyParticipantFinishes}
                        disabled={isApproval}
                        onChange={(e) => setNotifyParticipantFinishes(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Notify me when a participant finishes a review</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 ${
                        isApproval ? 'text-slate-400 cursor-not-allowed' : 'cursor-pointer text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproval ? false : enableVoting}
                        disabled={isApproval}
                        onChange={(e) => setEnableVoting(e.target.checked)}
                        className="rounded text-blue-600 disabled:opacity-50"
                      />
                      <span>Enable voting</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: PARTICIPANTS (Dual-Column: Select participants -> Select assignments) */}
            {/* ========================================================================= */}
            {step === 3 && (
              <div className="flex flex-col text-xs space-y-3">
                {/* Dual-Column Header matching media_1789105342448.png */}
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs w-[280px]">Select participants</h3>
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold">
                    ➔
                  </div>
                  <div className="flex-1 flex items-center justify-between pl-2">
                    <h3 className="font-bold text-slate-900 text-xs">Select assignments</h3>
                    {assignedParticipants.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllAssignments}
                        className="text-blue-600 hover:underline text-[11px] font-medium"
                      >
                        Clear all participants
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
                        Project team
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
                        Invite by email
                      </button>
                    </div>

                    {participantTab === 'team' ? (
                      <>
                        {/* Search box with magnifying glass */}
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Search by email or name"
                            value={searchParticipant}
                            onChange={(e) => setSearchParticipant(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 pr-7 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                        </div>

                        {/* Participant & Group list */}
                        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 max-h-[290px]">
                          {filteredAvailable.map((item) => {
                            const isAssigned = assignedParticipants.some((p) => p.id === item.id);
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
                                      Organization
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
                          Invite external team members by entering their email address.
                        </p>
                        <input
                          type="email"
                          placeholder="user@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleInviteByEmail()}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleInviteByEmail}
                          className="w-full py-1.5 bg-[#203a6b] hover:bg-[#162747] text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to assignments</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Select assignments */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 pb-2 text-[11px] font-semibold text-slate-700 border-b border-slate-100 px-1">
                      <div className="col-span-4">Participant</div>
                      <div className="col-span-4">Signer role</div>
                      <div className="col-span-3">Review role</div>
                      <div className="col-span-1 text-right"></div>
                    </div>

                    {/* Table Rows */}
                    {assignedParticipants.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400 italic">
                        No participants added yet. Select team members or groups on the left.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
                        {assignedParticipants.map((p) => (
                          <div
                            key={p.id}
                            className="grid grid-cols-12 gap-2 py-2 items-center text-xs px-1"
                          >
                            {/* Participant Name & Avatar */}
                            <div className="col-span-4 flex items-center gap-2 min-w-0">
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                />
                              ) : p.isGroup ? (
                                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                  <Users className="w-3.5 h-3.5" />
                                </div>
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

                            {/* Signer role Dropdown */}
                            <div className="col-span-4">
                              <div className="relative">
                                <select
                                  value={p.signerRole}
                                  disabled={p.reviewRole === 'REVIEWER'}
                                  onChange={(e) =>
                                    handleUpdateSignerRole(p.id, e.target.value as SignerRole)
                                  }
                                  className={`w-full text-xs px-2 py-1 pr-6 border rounded bg-white outline-none appearance-none transition-colors ${
                                    p.reviewRole === 'REVIEWER'
                                      ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                      : 'border-slate-300 text-slate-700 focus:ring-1 focus:ring-blue-500'
                                  }`}
                                >
                                  {SIGNER_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
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
                                className="text-blue-600 hover:text-red-600 p-0.5 inline-flex items-center"
                                title="Remove assignment"
                              >
                                <X className="w-4 h-4" />
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
            {/* STEP 4: INVITATION (Khớp media_1789105360969.png)                         */}
            {/* ========================================================================= */}
            {step === 4 && (
              <div className="space-y-4 text-xs">
                {/* Participants summary */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Participants</label>
                  <input
                    type="text"
                    readOnly
                    value={participantsSummaryText}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 bg-slate-50 text-slate-700 rounded outline-none cursor-default"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setIsSubjectDirty(true);
                    }}
                    placeholder="Subject for review invitation email..."
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={invitationMessage}
                    onChange={(e) => {
                      setInvitationMessage(e.target.value);
                      setIsMessageDirty(true);
                    }}
                    placeholder="Custom message to review participants..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Items summary preview */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-700">
                      Included Items ({reviewItems.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Will be snapshotted into Review Baseline (v1)
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2 max-h-24 overflow-y-auto space-y-1">
                    {reviewItems.slice(0, 10).map((item) => (
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
                        ...and {reviewItems.length - 10} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Email preview matching screenshot */}
                <div className="pt-2 text-xs text-slate-700 space-y-3 font-sans leading-relaxed border-t border-slate-100">
                  <div>
                    Your review role is:{' '}
                    <span className="text-slate-500 font-mono text-[11px]">*&#91; review role &#93;*</span>
                  </div>

                  <div className="text-slate-500 text-[11px] italic">
                    *&#91; If participant is an approver &#93;*
                  </div>

                  <div className="pl-3 border-l-2 border-slate-200 space-y-1 text-slate-600 text-xs">
                    <div>
                      Your signer role is:{' '}
                      <span className="text-slate-500 font-mono text-[11px]">
                        *&#91; Assigned signer role &#93;*
                      </span>
                    </div>
                    <div>
                      Your signature will be used for the following meaning: I approve the content of this review.
                    </div>
                  </div>

                  <div className="pt-1 text-blue-600 text-xs break-all hover:underline cursor-pointer">
                    https://jama-carledawade.jamacloud.com/review.req#/r:REV-??
                  </div>

                  <div className="text-xs text-slate-700">
                    Deadline:{' '}
                    <span className="font-medium">
                      {formatDeadlineDisplay(deadlineDate, deadlineTime)}
                    </span>
                  </div>

                  <div className="pt-2 text-xs text-slate-700">
                    <p>Thank you,</p>
                    <p className="font-medium text-slate-900">{currentUser?.fullName || 'Carleda Wade'}</p>
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
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 transition-colors shadow-sm"
                >
                  Cancel
                </button>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {itemCount} items | {assignedParticipants.length} participants
              </span>
            </div>

            <div className="flex items-center gap-2">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1) {
                      if (!name.trim()) {
                        setError('Please enter a review name (required)');
                        return;
                      }
                      if (reviewItems.length === 0) {
                        setError('Please select at least one item from the project to review');
                        return;
                      }
                    }
                    setError(null);
                    setStep((step + 1) as 1 | 2 | 3 | 4);
                  }}
                  className="px-6 py-1.5 text-xs font-semibold text-white bg-[#203a6b] hover:bg-[#162747] rounded shadow-sm transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  disabled={createReviewMutation.isPending}
                  onClick={() => handleSubmit(true)}
                  className="px-6 py-1.5 text-xs font-semibold text-white bg-[#203a6b] hover:bg-[#162747] rounded shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{createReviewMutation.isPending ? 'Initiating...' : 'Initiate review'}</span>
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
          alreadySelectedItemIds={reviewItems.map((i) => i.id)}
          onSelectItems={handleAddItemsFromTree}
        />
      )}
    </>
  );
};
