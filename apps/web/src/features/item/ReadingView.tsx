import React, { useState } from 'react';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  RotateCcw,
  List,
  FileText,
  Settings,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { CustomizeColumnsModal } from './components/CustomizeColumnsModal';
import { Button } from '../../components/ui/button';

interface ReadingItem {
  id: string;
  itemKey: string;
  name: string;
  description?: string | null;
  sectionNumber?: string;
  fields?: Record<string, string>;
}

interface ReadingViewProps {
  items?: ReadingItem[];
  isLoading?: boolean;
  onOpenFilter?: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  items: propItems,
  isLoading,
  onOpenFilter,
}) => {
  const { currentProject, setActiveView } = useProjectStore();
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Specifications matching Image 4
  const defaultSections = [
    {
      id: 'sec-1',
      number: '1',
      title: 'Business Requirements',
      isSectionOnly: true,
    },
    {
      id: 'sec-1-1',
      number: '1.1',
      title: 'Problem Statement',
      specifications: [
        {
          label: 'The problem of',
          content:
            'Dental software being clunky and focused heavily on administrative tasks. This results in dentists trying to manage procedures and images within calendaring programs that expect the user to be sitting at a desk interacting with a system using a mouse and keyboard.',
        },
        {
          label: 'The impact of which is',
          content:
            'Dentists cannot free themselves to focus on a patient\'s dental needs and must go between a surgical environment to one that is best accessed from within a cubicle.',
        },
        {
          label: 'Software that is user-friendly and focused more on clinical needs',
          content:
            'The system will know what information is important to the dental procedure being performed. The user will be able to record notes or review history via simple and intuitive controls.',
        },
      ],
    },
    {
      id: 'sec-1-2',
      number: '1.2',
      title: 'Position Statement',
      specifications: [
        {
          label: 'For',
          content: 'Dental practitioners and clinical assistants managing high-throughput patient visits.',
        },
        {
          label: 'Who',
          content: 'Require zero-touch or minimal-latency clinical record access in sterile operational environments.',
        },
        {
          label: 'The MediKiosk Pro is',
          content: 'An integrated touchscreen and mobile requirements-verified clinical companion platform.',
        },
      ],
    },
  ];

  return (
    <div
      className={`flex-1 flex flex-col h-full font-sans text-xs select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0d1117] text-slate-200' : 'bg-white text-slate-800'
      }`}
    >
      {/* 1. Workspace Sub-Header matching Image 4 */}
      <div
        className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 transition-colors duration-200 ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Left: Project Title + Item count + Filter Results link */}
        <div className="flex items-center gap-3">
          <h2
            className={`text-base font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {currentProject?.name || 'MediKiosk Pro'}
          </h2>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>96 items</span>
          <button
            type="button"
            onClick={onOpenFilter}
            className="flex items-center gap-1 text-xs text-[#0088cc] hover:underline font-medium"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Filter Results</span>
          </button>
        </div>

        {/* Right: Action Bar (Refresh, View Switcher, Settings Gear, Export, Actions, Add) */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="jama"
            size="sm"
            onClick={() => window.location.reload()}
            title="Refresh items"
            className="p-1.5 h-7"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* View Switcher: List [☰] vs Reading [📄] (Reading is active in Image 4) */}
          <div
            className={`flex items-center border-2 rounded p-0.5 shadow-2xs ${
              isDark ? 'border-slate-600 bg-[#21262d]' : 'border-rose-300/80 bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className={`p-1 rounded transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="List View (Image 3)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('reading')}
              className={`p-1 rounded font-semibold shadow-2xs ${
                isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
              }`}
              title="Reading View (Image 4)"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            type="button"
            variant="jama"
            size="sm"
            onClick={() => setIsCustomizeOpen(true)}
            className="h-7 px-2 gap-1 text-slate-700"
            title="Customize Columns"
          >
            <Settings className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          <Button
            type="button"
            variant="jama"
            size="sm"
            className="h-7 px-2.5 gap-1 font-semibold text-xs text-slate-700"
          >
            <span>Export</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          <Button
            type="button"
            variant="jama"
            size="sm"
            className="h-7 px-2.5 gap-1 font-semibold text-xs text-slate-700"
          >
            <span>Actions</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>

          <Button
            type="button"
            variant="jama"
            size="sm"
            className="h-7 px-3 gap-1 font-semibold text-xs text-slate-700"
          >
            <span>Add</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>

      {/* 2. Top Reading View Selection Bar (Gray header with checkbox matching Image 4) */}
      <div
        className={`h-7 border-b flex items-center px-3 gap-2 ${
          isDark ? 'bg-[#21262d] border-[#30363d] text-slate-200' : 'bg-[#8c949e] border-slate-300 text-white'
        }`}
      >
        <input
          type="checkbox"
          className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
        />
      </div>

      {/* 3. Document Body with Section Numbering & Specification Table matching Image 4 */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full relative">
        {defaultSections.map((sec) => (
          <div key={sec.id} className="space-y-4">
            {/* Section Heading with Checkbox matching Image 4 */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-600 focus:ring-0 h-3.5 w-3.5"
              />
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span className="text-[#0088cc] mr-1.5 font-bold">{sec.number}</span>
                {sec.title}
              </h3>
            </div>

            {/* Specification Table matching Image 4 */}
            {sec.specifications && (
              <div
                className={`border rounded-xs overflow-hidden shadow-2xs ml-6 ${
                  isDark ? 'border-[#30363d]' : 'border-slate-400/80'
                }`}
              >
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {sec.specifications.map((spec, sIdx) => (
                      <tr
                        key={sIdx}
                        className={
                          sIdx > 0
                            ? isDark
                              ? 'border-t border-[#30363d]'
                              : 'border-t border-slate-400/80'
                            : ''
                        }
                      >
                        {/* Left gray header cell (~30% width) */}
                        <td
                          className={`w-1/3 p-3.5 font-normal border-r align-top leading-snug ${
                            isDark
                              ? 'bg-[#161b22] text-slate-200 border-[#30363d]'
                              : 'bg-[#f0f2f5] text-slate-800 border-slate-400/80'
                          }`}
                        >
                          {spec.label}
                        </td>
                        {/* Right white content cell (~70% width) */}
                        <td
                          className={`w-2/3 p-3.5 leading-relaxed font-normal ${
                            isDark ? 'bg-[#0d1117] text-slate-300' : 'bg-white text-slate-700'
                          }`}
                        >
                          {spec.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. Floating Bottom-Right Pagination Bar matching Image 4 */}
      <div
        className={`absolute right-4 bottom-4 rounded shadow-md px-2 py-1 flex items-center gap-1.5 text-xs z-20 border transition-colors ${
          isDark ? 'bg-[#161b22] border-[#30363d] text-slate-200' : 'bg-white border-slate-300 text-slate-700'
        }`}
      >
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(1)}
          className={`p-1 disabled:opacity-30 rounded transition-colors ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className={`p-1 disabled:opacity-30 rounded transition-colors ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className={isDark ? 'px-1 text-slate-400' : 'px-1 text-slate-600'}>Page</span>
        <input
          type="text"
          readOnly
          value={page}
          className={`w-7 text-center rounded py-0.5 text-xs font-semibold border ${
            isDark ? 'bg-[#0d1117] border-[#30363d] text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}
        />
        <span className={isDark ? 'px-1 text-slate-400' : 'px-1 text-slate-600'}>of 2</span>

        <button
          type="button"
          disabled={page >= 2}
          onClick={() => setPage((p) => p + 1)}
          className={`p-1 disabled:opacity-30 rounded transition-colors ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={page >= 2}
          onClick={() => setPage(2)}
          className={`p-1 disabled:opacity-30 rounded transition-colors ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Customize Columns Modal */}
      <CustomizeColumnsModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        visibleColumns={{}}
        onToggleColumn={() => {}}
        onSelectAll={() => {}}
      />
    </div>
  );
};
