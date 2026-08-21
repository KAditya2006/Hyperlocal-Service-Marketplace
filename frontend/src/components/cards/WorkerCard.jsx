import { MapPin, MessageSquare, CalendarDays, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Rating from '../ui/Rating';
import Button from '../ui/Button';
import { formatInr } from '../../utils/formatters';

export const WorkerCard = ({
  worker,
  onChat,
  onBook,
  onViewProfile,
  t = (k, o) => o?.defaultValue || k,
  className = ''
}) => {
  if (!worker) return null;

  const user = worker.user || {};
  const skills = worker.skills || [];
  const primarySkill = skills[0] || 'Professional';
  const isAvailable = worker.availabilityStatus === 'Available' || worker.availability !== false;
  const isOnline = user.isOnline || false;

  return (
    <Card
      variant="elevated"
      padding="md"
      className={`flex flex-col justify-between space-y-4 text-left ${className}`}
    >
      <div className="space-y-3.5">
        {/* Header: Avatar, Name, Rating */}
        <div className="flex items-start gap-3.5">
          <Avatar
            src={user.avatar}
            alt={user.name}
            size="lg"
            isOnline={isOnline}
            showPresence={true}
          />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4
                onClick={onViewProfile}
                className="text-base sm:text-lg font-bold text-slate-900 truncate hover:text-primary-600 cursor-pointer transition-colors"
              >
                {user.name}
              </h4>
              <ShieldCheck size={16} className="text-primary-600 shrink-0" title="Verified Worker" />
            </div>

            <p className="text-xs font-bold text-primary-700 capitalize">
              {t(`services.${primarySkill}`, { defaultValue: primarySkill })}
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              <Rating rating={worker.averageRating} totalReviews={worker.totalReviews} size="sm" />
              <Badge status={worker.availabilityStatus || (isAvailable ? 'Available' : 'Offline')} size="sm" showDot={true} />
            </div>
          </div>
        </div>

        {/* Bio */}
        {worker.bio && (
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 font-normal">
            {worker.bio}
          </p>
        )}

        {/* Skills Pills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full capitalize"
              >
                {t(`services.${skill}`, { defaultValue: skill })}
              </span>
            ))}
          </div>
        )}

        {/* Location & Pricing */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate">
            <MapPin size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">{user.location?.address || t('common.nearby', { defaultValue: 'Nearby' })}</span>
          </div>

          {worker.pricing?.amount && (
            <span className="font-bold text-slate-900 shrink-0 text-sm">
              {formatInr(worker.pricing.amount)}/{worker.pricing.unit || 'hr'}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChat?.(worker)}
          iconLeft={MessageSquare}
          className="w-full justify-center"
        >
          {t('common.chat', { defaultValue: 'Chat' })}
        </Button>

        <Button
          size="sm"
          variant={isAvailable ? 'primary' : 'secondary'}
          disabled={!isAvailable}
          onClick={() => onBook?.(worker)}
          iconLeft={CalendarDays}
          className="w-full justify-center"
        >
          {isAvailable ? t('common.book', { defaultValue: 'Book' }) : t('common.unavailable', { defaultValue: 'Busy' })}
        </Button>
      </div>
    </Card>
  );
};

export default WorkerCard;
