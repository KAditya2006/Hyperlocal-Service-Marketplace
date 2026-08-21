import { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'left',
  maxWidth = 'max-w-xs sm:max-w-sm',
  className = ''
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    left: 'left-0 top-0 bottom-0 h-full animate-in slide-in-from-left duration-200 border-r',
    right: 'right-0 top-0 bottom-0 h-full animate-in slide-in-from-right duration-200 border-l',
    bottom: 'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl animate-in slide-in-from-bottom duration-200 border-t'
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`fixed bg-white border-slate-200 elevation-modal flex flex-col w-full ${maxWidth} ${positionClasses[position] || positionClasses.left} ${className}`}
      >
        {title && (
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Drawer;
