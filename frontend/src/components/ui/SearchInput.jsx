import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export const SearchInput = React.forwardRef(({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  loading = false,
  voiceSlot,
  className = '',
  id = 'search-input',
  autoFocus = false,
  ...props
}, ref) => {
  const hasValue = Boolean(value && String(value).length > 0);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 sm:left-4 pointer-events-none text-slate-400">
        <Search size={18} />
      </div>

      <input
        ref={ref}
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-white border border-slate-200 pl-10 sm:pl-11 pr-20 py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 font-medium rounded-xl sm:rounded-2xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all min-h-[44px]"
        {...props}
      />

      <div className="absolute right-2.5 sm:right-3 flex items-center gap-1.5">
        {loading && <Loader2 size={16} className="animate-spin text-primary-600" />}

        {hasValue && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        {voiceSlot}
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
