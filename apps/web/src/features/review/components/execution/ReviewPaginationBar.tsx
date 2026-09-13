import React from 'react';

interface ReviewPaginationBarProps {
  totalCount: number;
}

export const ReviewPaginationBar: React.FC<ReviewPaginationBarProps> = ({ totalCount }) => {
  return (
    <footer className="h-9 border-t border-slate-200 px-6 flex items-center justify-between bg-slate-50 text-xs text-slate-500 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span>Page 1 of 1</span>
        <span>•</span>
        <span>Show: 50</span>
      </div>
      <div>
        <span>
          Displaying 1 - {totalCount} of {totalCount}
        </span>
      </div>
    </footer>
  );
};
