import { Zap, Droplets, BookOpen, Hammer, Palette, Sparkles, Wind, Briefcase, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const SERVICE_ICONS = {
  electrician: { icon: Zap, bg: 'bg-amber-50 text-amber-600 border-amber-100' },
  plumber: { icon: Droplets, bg: 'bg-blue-50 text-blue-600 border-blue-100' },
  'home tutors': { icon: BookOpen, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  carpenters: { icon: Hammer, bg: 'bg-orange-50 text-orange-600 border-orange-100' },
  painters: { icon: Palette, bg: 'bg-rose-50 text-rose-600 border-rose-100' },
  'house cleaner': { icon: Sparkles, bg: 'bg-teal-50 text-teal-600 border-teal-100' },
  'ac repair/service': { icon: Wind, bg: 'bg-cyan-50 text-cyan-600 border-cyan-100' }
};

export const ServiceCard = ({
  serviceKey,
  title,
  description,
  isActive = true,
  onSelect,
  actionLabel = 'Find Worker',
  className = ''
}) => {
  const meta = SERVICE_ICONS[serviceKey] || { icon: Briefcase, bg: 'bg-primary-50 text-primary-600 border-primary-100' };
  const Icon = meta.icon;

  return (
    <Card
      variant={isActive ? 'interactive' : 'subtle'}
      padding="md"
      onClick={isActive && onSelect ? onSelect : undefined}
      className={`flex flex-col justify-between space-y-4 text-left select-none ${
        !isActive ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="space-y-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${meta.bg}`}>
          <Icon size={24} />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 capitalize">{title}</h4>
            {!isActive && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mt-1 font-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      {isActive && (
        <div className="pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onSelect}
            iconRight={ArrowRight}
            className="w-full justify-between hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200"
          >
            <span>{actionLabel}</span>
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ServiceCard;
