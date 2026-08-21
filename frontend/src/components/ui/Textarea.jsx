import React from 'react';

export const Textarea = React.forwardRef(({
  label,
  error,
  helperText,
  required = false,
  maxLength,
  value,
  rows = 4,
  className = '',
  id,
  disabled = false,
  ...props
}, ref) => {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs sm:text-sm font-semibold text-slate-700 select-none"
          >
            {label}
            {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        {maxLength && (
          <span className="text-[11px] font-medium text-slate-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full bg-white border rounded-xl p-3.5 sm:p-4 text-sm text-slate-900 placeholder:text-slate-400 font-medium transition-all outline-none resize-y ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
            : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
        } ${
          disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''
        } ${className}`}
        {...props}
      />

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

Textarea.displayName = 'Textarea';

export default Textarea;
