import { AlertCircle } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An unexpected error occurred while loading this section.',
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-rose-50/40 rounded-3xl border border-rose-100/80 space-y-4 max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
        <AlertCircle size={28} />
      </div>

      <div className="space-y-1">
        <h4 className="text-base sm:text-lg font-bold text-slate-900">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xs">{description}</p>
      </div>

      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-2 bg-white"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
