export const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const variantClasses = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4'
  };

  const style = {
    width: width || undefined,
    height: height || undefined
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-slate-200/80 ${variantClasses[variant] || variantClasses.rectangular} ${className}`}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white rounded-3xl p-5 border border-slate-100 elevation-1 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="w-12 h-12 shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
    <Skeleton variant="rectangular" className="h-16 w-full" />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" className="h-10 flex-1" />
      <Skeleton variant="rectangular" className="h-10 flex-1" />
    </div>
  </div>
);

export default Skeleton;
