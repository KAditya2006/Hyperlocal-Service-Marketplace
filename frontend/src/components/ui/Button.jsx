import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-xs focus-visible:ring-primary-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 focus-visible:ring-slate-400',
  outline: 'border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 shadow-xs focus-visible:ring-primary-500',
  ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus-visible:ring-rose-500',
  success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus-visible:ring-emerald-500',
  link: 'bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto'
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg touch-target sm:min-h-0',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-xl min-h-[44px]',
  lg: 'px-5 py-3 text-base font-bold rounded-2xl min-h-[48px]',
  icon: 'w-10 h-10 p-0 rounded-xl flex items-center justify-center min-h-[44px] min-w-[44px]'
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const isLink = variant === 'link';
  const sizeClass = isLink ? '' : (SIZES[size] || SIZES.md);
  const variantClass = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClass} ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin shrink-0" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {IconLeft && <IconLeft size={size === 'sm' ? 14 : 18} className="shrink-0" />}
          {children && <span>{children}</span>}
          {IconRight && <IconRight size={size === 'sm' ? 14 : 18} className="shrink-0" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
