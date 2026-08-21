import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ServiceAddressInput from '../components/ServiceAddressInput';
import { createBooking, getWorkerDetails, initiateChat } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, MapPin, MessageSquare, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatInr } from '../utils/formatters';
import { getOnboardingMessage } from '../utils/onboarding';
import { getWorkerAvailabilityStatus } from '../utils/workerAvailability';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Rating } from '../components/ui/Rating';

const WorkerProfile = () => {
  const { t } = useTranslation();
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({ service: '', scheduledDate: '', address: '', additionalNotes: '', coordinates: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const { data } = await getWorkerDetails(workerId);
        setWorker(data.data.worker);
        setReviews(data.data.reviews);
        setBooking((current) => ({ ...current, service: data.data.worker.skills?.[0] || '' }));
      } catch {
        toast.error(t('workerProfile.notFound'));
      }
    };

    fetchWorker();
  }, [workerId, t]);

  const handleChat = async () => {
    if (!token) return navigate('/login', { state: { message: t('auth.notLoggedIn') } });
    if (user?.role !== 'user') return toast.error(t('search.onlyCustomersChat'));
    if (!user?.canAccessDashboard) return navigate('/profile', { state: { notice: getOnboardingMessage(user) } });

    try {
      await initiateChat({ recipientId: worker.user._id });
      navigate('/messages');
    } catch {
      toast.error(t('search.couldNotStartChat'));
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!token) return navigate('/login', { state: { message: t('auth.notLoggedIn') } });
    if (user?.role !== 'user') return toast.error(t('search.onlyCustomersBook'));
    if (!isAvailable) return toast.error(t('search.workerUnavailable', { status: availabilityStatus.toLowerCase() }));

    setSubmitting(true);
    try {
      await createBooking({
        workerId: worker.user._id,
        service: booking.service || worker.skills?.[0] || t('workerProfile.generalService'),
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        ...(booking.coordinates ? {
          serviceLocation: {
            coordinates: booking.coordinates,
            address: booking.address
          }
        } : {}),
        additionalNotes: booking.additionalNotes
      });
      toast.success(t('search.bookingSent'));
      setBooking({ service: worker.skills?.[0] || '', scheduledDate: '', address: '', additionalNotes: '', coordinates: null });
    } catch (error) {
      toast.error(error.response?.data?.message || t('search.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!worker) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">
          {t('workerProfile.loading')}
        </div>
      </div>
    );
  }

  const availabilityStatus = getWorkerAvailabilityStatus(worker);
  const isAvailable = availabilityStatus === 'Available';
  const isOnline = worker.user?.isOnline || false;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] gap-6 lg:gap-8 min-w-0">
        {/* Left Column: Worker Details & Reviews */}
        <section className="space-y-6 min-w-0">
          <Card variant="elevated" padding="lg" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
              <Avatar
                src={worker.user?.avatar}
                alt={worker.user?.name}
                size="xl"
                isOnline={isOnline}
                showPresence={true}
              />

              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
                    {worker.user?.name}
                  </h1>
                  <ShieldCheck size={20} className="text-primary-600 shrink-0" title={t('common.verifiedWorker', { defaultValue: 'Verified Worker' })} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Rating rating={worker.averageRating} totalReviews={worker.totalReviews} size="md" />
                  <Badge status={availabilityStatus} size="sm" showDot={true} />
                </div>

                <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                  <MapPin size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate">{worker.user?.location?.address || t('common.nearby')}</span>
                </p>

                {worker.pricing?.amount && (
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 pt-1">
                    {formatInr(worker.pricing.amount)}/{worker.pricing.unit || t('workerDashboard.hour')}
                  </p>
                )}
              </div>
            </div>

            {worker.bio && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">About Worker</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">{worker.bio}</p>
              </div>
            )}

            {worker.skills?.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills & Services</h3>
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-primary-50 text-primary-700 px-3.5 py-1 rounded-full text-xs font-bold capitalize border border-primary-100/60"
                    >
                      {t(`services.${skill}`, { defaultValue: skill })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Customer Reviews Section */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t('workerProfile.reviews')} ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium py-4">
                {t('workerProfile.noReviews')}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((review) => (
                  <div key={review._id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {review.user?.name || t('bookingDetails.customer')}
                      </span>
                      <Rating rating={review.rating} size="sm" showCount={false} />
                    </div>
                    {review.comment && (
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Right Column: Sticky Booking & Action Panel */}
        <aside className="space-y-4 h-fit">
          <Button
            size="md"
            variant="outline"
            onClick={handleChat}
            iconLeft={MessageSquare}
            fullWidth
            className="justify-center"
          >
            {t('common.chat')}
          </Button>

          <Card variant="elevated" padding="md" className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {t('workerProfile.bookThisWorker')}
            </h2>

            <form onSubmit={handleBooking} className="space-y-3.5">
              <Input
                required
                label={t('search.service')}
                value={booking.service}
                onChange={(e) => setBooking({ ...booking, service: e.target.value })}
                placeholder={t('search.service')}
              />

              <Input
                required
                type="datetime-local"
                label="Scheduled Date & Time"
                value={booking.scheduledDate}
                onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })}
              />

              <ServiceAddressInput
                value={booking.address}
                onChange={({ address, coordinates }) => setBooking({ ...booking, address, coordinates })}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  {t('bookingDetails.notes')}
                </label>
                <textarea
                  value={booking.additionalNotes}
                  onChange={(e) => setBooking({ ...booking, additionalNotes: e.target.value })}
                  placeholder={t('bookingDetails.notes')}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <Button
                type="submit"
                variant={isAvailable ? 'primary' : 'secondary'}
                disabled={!isAvailable || submitting}
                loading={submitting}
                iconLeft={CalendarDays}
                fullWidth
                size="md"
                className="mt-2 justify-center"
              >
                {isAvailable ? t('common.sendRequest') : t('workerProfile.workerUnavailable')}
              </Button>
            </form>
          </Card>
        </aside>
      </main>
    </div>
  );
};

export default WorkerProfile;
