import { Inbox } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon,
  title = 'No records found',
  description = 'There are currently no items to display.',
  actionLabel,
  onAction,
  className = ''
}) => {
  const IconComponent = icon || Inbox;

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-100 elevation-1 space-y-4 max-w-md mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100/80 shadow-xs">
        <IconComponent size={28} />
      </div>

      <div className="space-y-1">
        <h4 className="text-base sm:text-lg font-bold text-slate-900">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs">{description}</p>
      </div>

      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="primary"
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
