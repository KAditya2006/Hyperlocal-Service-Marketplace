import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, MessageSquare, Star } from 'lucide-react';
import { formatInr } from '../../utils/formatters';
import { fallbackAvatar, withImageFallback } from '../../utils/images';
import { getUserPresenceClass, getUserPresenceStatus } from '../../utils/presence';
import { getWorkerAvailabilityClass, getWorkerAvailabilityStatus } from '../../utils/workerAvailability';
import { formatDistance, getWorkerSkills } from '../../utils/serviceSearch';

const WorkerSearchCard = ({ worker, onChat, onBook, t }) => {
  const workerSkills = getWorkerSkills(worker);
  const distanceLabel = formatDistance(worker.distanceKm, t);
  const availabilityStatus = getWorkerAvailabilityStatus(worker);
  const isAvailable = availabilityStatus === 'Available';
  const presenceStatus = getUserPresenceStatus(worker.user);

  return (
    <article className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 premium-shadow flex flex-col gap-5 min-w-0">
      <div className="flex gap-4 min-w-0">
        <img
          src={worker.user?.avatar || fallbackAvatar}
          onError={withImageFallback()}
          alt={worker.user?.name}
          className="w-16 h-16 rounded-2xl object-cover"
        />
        <div className="min-w-0">
          <Link to={`/workers/${worker.user?._id}`} className="font-bold text-xl text-slate-900 truncate hover:text-primary-600 block">
            {worker.user?.name}
          </Link>
          <p className="flex items-center gap-1 text-sm text-amber-500 font-bold">
            <Star size={16} fill="currentColor" /> {worker.averageRating?.toFixed(1) || '0.0'} ({worker.totalReviews || 0})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`text-xs font-black border rounded-full px-2.5 py-1 ${getWorkerAvailabilityClass(availabilityStatus)}`}>
              {availabilityStatus}
            </span>
            <span className={`text-xs font-black border rounded-full px-2.5 py-1 ${getUserPresenceClass(worker.user)}`}>
              {presenceStatus}
            </span>
            {distanceLabel && (
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                {distanceLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-slate-600 line-clamp-3">{worker.bio}</p>

      <div className="flex flex-wrap gap-2">
        {workerSkills.map((skill) => (
          <span key={skill} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
            {t(`services.${skill}`, { defaultValue: skill })}
          </span>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-500">
        <span className="flex items-start gap-1 min-w-0">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          <span className="break-words">{worker.user?.location?.address || t('common.nearby')}</span>
        </span>
        <span className="font-bold text-slate-900">
          {formatInr(worker.pricing?.amount)}/{worker.pricing?.unit || 'hour'}
        </span>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 mt-auto">
        <button onClick={() => onChat(worker)} className="border border-slate-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
          <MessageSquare size={18} /> {t('common.chat')}
        </button>
        <button
          onClick={() => onBook(worker)}
          disabled={!isAvailable}
          className="bg-slate-900 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          <CalendarDays size={18} /> {isAvailable ? t('common.book') : t('common.unavailable')}
        </button>
      </div>
    </article>
  );
};

export default WorkerSearchCard;
