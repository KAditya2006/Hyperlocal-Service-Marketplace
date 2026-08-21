import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  error,
  helperText,
  required = false,
  options = [],
  className = '',
  id,
  disabled = false,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs sm:text-sm font-semibold text-slate-700 select-none"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full bg-white border rounded-xl py-2.5 sm:py-3 pl-3.5 sm:pl-4 pr-10 text-sm text-slate-900 font-medium transition-all outline-none appearance-none min-h-[44px] cursor-pointer ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
          } ${
            disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''
          } ${className}`}
          {...props}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-slate-400">
          <ChevronDown size={18} />
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p className="text-xs text-slate-500 font-normal">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
