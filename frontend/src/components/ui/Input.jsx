import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  required = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  onRightIconClick,
  className = '',
  id,
  type = 'text',
  disabled = false,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-semibold text-slate-700 select-none"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {IconLeft && (
          <div className="absolute left-3.5 pointer-events-none text-slate-400">
            <IconLeft size={18} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full bg-white border rounded-xl py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 font-medium transition-all outline-none min-h-[44px] ${
            IconLeft ? 'pl-10.5' : 'pl-3.5 sm:pl-4'
          } ${
            IconRight ? 'pr-10.5' : 'pr-3.5 sm:pr-4'
          } ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
          } ${
            disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''
          } ${className}`}
          {...props}
        />

        {IconRight && (
          <button
            type="button"
            tabIndex={onRightIconClick ? 0 : -1}
            onClick={onRightIconClick}
            disabled={disabled || !onRightIconClick}
            className={`absolute right-3.5 text-slate-400 ${
              onRightIconClick ? 'cursor-pointer hover:text-slate-600' : 'pointer-events-none'
            }`}
          >
            <IconRight size={18} />
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600 flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}

      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500 font-normal">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
