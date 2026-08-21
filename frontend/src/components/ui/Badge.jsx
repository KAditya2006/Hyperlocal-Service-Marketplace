import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  User,
  Shield
} from 'lucide-react';

const BADGE_CONFIG = {
  // Worker Availability
  Available: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  Busy: { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  Offline: { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },

  // Booking / Verification Statuses
  completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', icon: CheckCircle2 },
  approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', icon: CheckCircle2 },
  verified: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', icon: ShieldCheck },
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: Clock },
  in_progress: { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', icon: Clock },
  accepted: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', icon: CheckCircle2 },
  cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', icon: XCircle },
  rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', icon: XCircle },
  failed: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', icon: AlertCircle },

  // Roles
  user: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: User, label: 'Customer' },
  worker: { bg: 'bg-primary-50 text-primary-700 border-primary-200/80', icon: Briefcase, label: 'Worker' },
  admin: { bg: 'bg-purple-50 text-purple-700 border-purple-200/80', icon: Shield, label: 'Admin' },

  // Neutral / General
  neutral: { bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  primary: { bg: 'bg-primary-50 text-primary-700 border-primary-200/80' }
};

export const Badge = ({
  status,
  label,
  variant,
  icon: CustomIcon,
  size = 'md',
  showDot = false,
  className = ''
}) => {
  const key = status || variant || 'neutral';
  const config = BADGE_CONFIG[key] || BADGE_CONFIG.neutral;
  const IconComponent = CustomIcon || config.icon;
  const displayLabel = label || config.label || status;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  return (
    <span
      className={`inline-flex items-center font-bold border rounded-full uppercase tracking-wider select-none shrink-0 ${
        config.bg
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot || 'bg-current'}`} />
      )}
      {IconComponent && <IconComponent size={size === 'sm' ? 10 : 13} className="shrink-0" />}
      {displayLabel && <span>{displayLabel}</span>}
    </span>
  );
};

export default Badge;
