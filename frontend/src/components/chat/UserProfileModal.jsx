import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User as UserIcon,
  Briefcase,
  Star,
  CheckCircle2,
  Calendar,
  Loader2,
  Clock,
  Zap,
  Droplets,
  BookOpen,
  Sparkles,
  Wind,
  Hammer
} from 'lucide-react';
import { format } from 'date-fns';
import { fallbackAvatar, withImageFallback } from '../../utils/images';
import { getUserPublicProfile } from '../../services/api';
import toast from 'react-hot-toast';

const SERVICE_ICON_MAP = {
  electrician: Zap,
  plumber: Droplets,
  'home tutors': BookOpen,
  carpenters: Hammer,
  'house cleaner': Sparkles,
  'ac repair/service': Wind
};

const UserProfileModal = ({ userId, isOpen, onClose, onDiscussWorker }) => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const res = await getUserPublicProfile(userId);
        if (isMounted && res.data?.success) {
          setProfileData(res.data.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const errMsg = err.response?.data?.message || t('common.errorLoadingProfile', { defaultValue: 'Failed to load profile' });
          setError(errMsg);
          toast.error(errMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, t]);

  if (!isOpen) return null;

  const user = profileData?.user;
  const serviceHistory = profileData?.serviceHistory || [];

  const formatServiceDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      return format(new Date(dateVal), 'dd MMM yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl sm:rounded-[36px] premium-shadow border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold shadow-xs">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {t('chat.userProfileTitle', { defaultValue: 'User Profile' })}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t('chat.userProfileSubtitle', { defaultValue: 'Public profile & completed service history' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <Loader2 className="animate-spin text-primary-600" size={32} />
              <p className="text-sm font-bold">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto font-bold">
                <X size={24} />
              </div>
              <p className="font-bold text-slate-900">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
              >
                {t('common.close', { defaultValue: 'Close' })}
              </button>
            </div>
          ) : (
            <>
              {/* User Identity Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={user?.avatar || fallbackAvatar}
                    onError={withImageFallback()}
                    alt={user?.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      user?.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  ></div>
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                      {user?.name}
                    </h4>
                    <span className="bg-primary-50 text-primary-700 border border-primary-100 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {t('auth.roleUser', { defaultValue: 'Customer' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>{user?.isOnline ? t('chat.activeNow') : t('chat.offline')}</span>
                    </span>
                    {user?.memberSince && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>
                          {t('profile.memberSince', { defaultValue: 'Member since' })}{' '}
                          {formatServiceDate(user.memberSince)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Service History Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-primary-600" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {t('chat.serviceHistoryTitle', { defaultValue: 'Service History' })}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {serviceHistory.length} {serviceHistory.length === 1 ? t('common.service', { defaultValue: 'service' }) : t('common.services', { defaultValue: 'services' })}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {t('chat.serviceHistoryHint', {
                    defaultValue: 'Completed services previously booked by this user on InstantSeva.'
                  })}
                </p>

                {/* Service History List */}
                {serviceHistory.length === 0 ? (
                  <div className="bg-slate-50/60 rounded-2xl p-6 sm:p-8 text-center border border-dashed border-slate-200 space-y-2">
                    <Briefcase size={32} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">
                      {t('chat.noServiceHistory', { defaultValue: 'No completed services yet.' })}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {t('chat.noServiceHistoryDetail', {
                        defaultValue: 'This user has not completed any service bookings on InstantSeva yet.'
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {serviceHistory.map((item) => {
                      const ServiceIcon = SERVICE_ICON_MAP[item.service] || Briefcase;
                      const worker = item.worker;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-white hover:border-primary-100 hover:shadow-xs transition-all space-y-3"
                        >
                          {/* Top Row: Service & Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                <ServiceIcon size={16} />
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm capitalize">
                                  {t(`services.${item.service}`, { defaultValue: item.service })}
                                </h5>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {t('chat.completedOn', { defaultValue: 'Completed on' })}{' '}
                                  {formatServiceDate(item.completedAt)}
                                </p>
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 size={12} />
                              <span>{t('bookingStatus.completed', { defaultValue: 'Completed' })}</span>
                            </span>
                          </div>

                          {/* Worker Details Card inside Service Entry */}
                          {worker ? (
                            <div className="bg-slate-50/70 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={worker.avatar || fallbackAvatar}
                                  onError={withImageFallback()}
                                  alt={worker.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-white shrink-0"
                                />
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="font-bold text-slate-900 text-xs truncate">
                                      {worker.name}
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                      · {t('auth.roleWorker', { defaultValue: 'Worker' })}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    {typeof worker.averageRating === 'number' && worker.averageRating > 0 && (
                                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                        <Star size={11} fill="currentColor" />
                                        <span>{worker.averageRating.toFixed(1)}</span>
                                      </span>
                                    )}
                                    <span className="text-slate-400 truncate capitalize">
                                      {t(`services.${worker.profession}`, { defaultValue: worker.profession })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {onDiscussWorker && (
                                <button
                                  type="button"
                                  onClick={() => onDiscussWorker(worker, item.service)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-primary-700 bg-white border border-primary-100 rounded-lg hover:bg-primary-50 transition-all shrink-0"
                                  title="Discuss this worker in chat"
                                >
                                  {t('chat.discuss', { defaultValue: 'Discuss' })}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic">
                              {t('chat.workerNotAvailable', { defaultValue: 'Worker details unavailable' })}
                            </div>
                          )}

                          {/* Customer Rating if Left */}
                          {item.userRating && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1 border-t border-slate-50">
                              <span className="text-slate-400 font-medium">
                                {t('chat.ratingGiven', { defaultValue: 'Rating given by user:' })}
                              </span>
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star size={12} fill="currentColor" />
                                <span>{item.userRating}/5</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
