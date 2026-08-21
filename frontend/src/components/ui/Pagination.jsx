import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export const Pagination = ({
  page = 1,
  pages = 1,
  onPageChange,
  className = ''
}) => {
  if (pages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-2 select-none ${className}`}>
      <Button
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange && onPageChange(page - 1)}
        className="px-3"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <span className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-100/80 rounded-lg">
        Page {page} of {pages}
      </span>

      <Button
        size="sm"
        variant="outline"
        disabled={page >= pages}
        onClick={() => onPageChange && onPageChange(page + 1)}
        className="px-3"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
};

export default Pagination;
