import React, { useState } from 'react';
import { ProjectMemberSummary } from '@aljama/shared';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Search, X } from 'lucide-react';
import { useThemeStore } from '../../../stores/theme.store';

interface SelectUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ProjectMemberSummary[];
  selectedUserId?: string | null;
  onSelectUser: (user: ProjectMemberSummary | null) => void;
}

export const SelectUserModal: React.FC<SelectUserModalProps> = ({
  isOpen,
  onClose,
  members,
  selectedUserId,
  onSelectUser,
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSelectedId, setCurrentSelectedId] = useState<string | null>(selectedUserId || null);

  if (!isOpen) return null;

  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase();
    return m.fullName.toLowerCase().includes(term) || m.username.toLowerCase().includes(term);
  });

  const handleConfirm = () => {
    const selected = members.find(m => m.userId === currentSelectedId) || null;
    onSelectUser(selected);
    onClose();
  };

  const handleClear = () => {
    setCurrentSelectedId(null);
    onSelectUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div
        className={`w-full max-w-lg rounded-md shadow-2xl border flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 ${
          isDark
            ? 'bg-[#1c2128] border-[#30363d] text-slate-200'
            : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* Title Bar matching Image 3 */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b select-none ${
            isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#333333] text-white border-slate-700'
          }`}
        >
          <span className="font-semibold text-xs tracking-wide">Select a User</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-[#30363d] flex flex-col gap-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="start typing to filter users"
              className="pl-8 text-xs h-8 rounded"
              autoFocus
            />
          </div>
          <span className="text-[10px] text-slate-500 italic pl-1">
            showing top {filteredMembers.length} results
          </span>
        </div>

        {/* Table of Users */}
        <div className="flex-1 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead
              className={`sticky top-0 font-semibold border-b ${
                isDark
                  ? 'bg-[#161b22] border-[#30363d] text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <tr>
                <th className="py-2 px-3 border-r border-slate-200 dark:border-[#30363d]">
                  Full Name
                </th>
                <th className="py-2 px-3 border-r border-slate-200 dark:border-[#30363d]">
                  Username
                </th>
                <th className="py-2 px-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    No users match "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => {
                  const isSelected = currentSelectedId === member.userId;
                  return (
                    <tr
                      key={member.userId}
                      onClick={() => setCurrentSelectedId(member.userId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? isDark
                            ? 'bg-[#1f3a5f] text-white font-medium'
                            : 'bg-[#e0f2fe] text-blue-900 font-medium'
                          : isDark
                            ? 'hover:bg-[#161b22]'
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-3 flex items-center gap-2">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-[10px] flex items-center justify-center font-bold">
                            {member.fullName[0]}
                          </div>
                        )}
                        <span>{member.fullName}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                        {member.username}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{member.projectRole}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer matching Image 3 */}
        <div
          className={`flex items-center justify-end gap-2 p-2.5 border-t select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
          }`}
        >
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            className="h-7 text-xs bg-[#24a0d9] hover:bg-[#1f8ec3] text-white font-medium px-3"
          >
            Select User
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs px-3"
          >
            Clear Selection
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
