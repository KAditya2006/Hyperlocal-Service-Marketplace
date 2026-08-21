import Card from '../ui/Card';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  trendPositive = true,
  onClick,
  className = ''
}) => {
  return (
    <Card
      variant={onClick ? 'interactive' : 'elevated'}
      padding="md"
      onClick={onClick}
      className={`text-left select-none ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>

          {subtitle && (
            <p className="text-xs text-slate-400 font-normal">{subtitle}</p>
          )}

          {trend && (
            <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${
              trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {trend}
            </span>
          )}
        </div>

        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 shadow-xs border border-primary-100/60">
            <Icon size={22} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
