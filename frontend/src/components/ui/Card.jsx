import React from 'react';

const VARIANTS = {
  flat: 'bg-white border border-slate-200/80',
  elevated: 'bg-white border border-slate-100 elevation-1',
  subtle: 'bg-slate-50/70 border border-slate-100',
  interactive: 'bg-white border border-slate-200/80 elevation-1 card-interactive cursor-pointer hover:border-primary-200',
  primary: 'bg-primary-50/60 border border-primary-100'
};

const PADDINGS = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8'
};

export const Card = React.forwardRef(({
  children,
  variant = 'flat',
  padding = 'md',
  className = '',
  as = 'div',
  ...props
}, ref) => {
  const variantClass = VARIANTS[variant] || VARIANTS.flat;
  const paddingClass = PADDINGS[padding] || PADDINGS.md;
  const ElementTag = as || 'div';

  return (
    <ElementTag
      ref={ref}
      className={`rounded-2xl sm:rounded-3xl transition-colors ${variantClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </ElementTag>
  );
});

Card.displayName = 'Card';

export default Card;
