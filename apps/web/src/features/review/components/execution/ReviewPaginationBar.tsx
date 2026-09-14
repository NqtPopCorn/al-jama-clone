import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

interface ReviewPaginationBarProps {
  totalCount: number;
}

export const ReviewPaginationBar: React.FC<ReviewPaginationBarProps> = ({ totalCount }) => {
  return (
    <footer className="h-8 border-t border-slate-200 px-6 flex items-center justify-between bg-slate-50 text-[11px] text-slate-600 flex-shrink-0 select-none">
      {/* Left pagination controls matching Image 1 & 3 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-500">
          <button
            disabled
            className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-40"
            title="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled
            className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-40"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-1 text-slate-600">Page</span>
          <input
            type="text"
            value="1"
            readOnly
            className="w-7 text-center py-0.5 border border-slate-300 rounded bg-white text-[11px] font-semibold text-slate-700"
          />
          <span className="px-1 text-slate-600">of 1</span>
          <button
            disabled
            className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-40"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            disabled
            className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-40"
            title="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-l border-slate-300 pl-3">
          <span className="text-slate-500">Show:</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-medium">
            <span>50</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Right total display */}
      <div>
        <span className="text-slate-500">
          Displaying{' '}
          <strong className="font-semibold text-slate-700">
            {totalCount > 0 ? 1 : 0} - {totalCount}
          </strong>{' '}
          of <strong className="font-semibold text-slate-700">{totalCount}</strong>
        </span>
      </div>
    </footer>
  );
};
