import React, { Suspense, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createReview, getBookings, initiateChat, updateBookingPayment, updateBookingStatus, verifyStartOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  Clock,
  Key,
  MapPin,
  MessageSquare,
  Phone,
  Search as SearchIcon,
  Sparkles,
  Zap,
  Droplets,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { formatInr } from '../utils/formatters';
import { getBookingDestination } from '../utils/location';
import VoiceSearchButton from '../components/VoiceSearchButton';
import { normalizeServiceSearch } from '../utils/multilingualSearch';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/cards/StatCard';
import { Tabs } from '../components/ui/Tabs';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';

const TrackingMap = React.lazy(() => import('../components/TrackingMap'));
const BookingDetailsModal = React.lazy(() => import('../components/BookingDetailsModal'));

const ACTIVE_SERVICES = [
  { key: 'electrician', title: 'Electrician', icon: Zap, bg: 'bg-amber-50 text-amber-600 border-amber-100' },
  { key: 'plumber', title: 'Plumber', icon: Droplets, bg: 'bg-blue-50 text-blue-600 border-blue-100' },
  { key: 'home tutors', title: 'Home Tutor', icon: BookOpen, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForms, setReviewForms] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [otpInput, setOtpInput] = useState({});
  const [serviceQuery, setServiceQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeStatusTab, setActiveStatusTab] = useState('all');

  const openServiceSearch = (service) => {
    navigate(`/search?q=${encodeURIComponent(normalizeServiceSearch(service))}`);
  };

  const handleServiceSearch = (e) => {
    e.preventDefault();
    const query = normalizeServiceSearch(serviceQuery.trim());
    navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  const handleVoiceServiceSearch = React.useCallback((text, voiceContext = {}) => {
    const query = voiceContext.normalizedQuery || normalizeServiceSearch(text.trim());
    setServiceQuery(text);
    navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  }, [navigate]);

  const fetchBookings = useCallback(async (page = 1) => {
    try {
      const { data } = await getBookings({ page });
      setBookings(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const changeStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      toast.success(t('dashboard.bookingUpdated'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotUpdateBooking'));
    }
  };

  const changePayment = async (bookingId, paymentStatus) => {
    try {
      await updateBookingPayment(bookingId, { paymentStatus, paymentMethod: 'manual' });
      toast.success(t('dashboard.paymentUpdated'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotUpdatePayment'));
    }
  };

  const handleStartVerify = async (bookingId) => {
    try {
      if (!otpInput[bookingId]) return toast.error(t('dashboard.pleaseEnterOtp'));
      await verifyStartOTP(bookingId, otpInput[bookingId]);
      toast.success(t('dashboard.jobStarted'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.invalidOtp'));
    }
  };

  const submitReview = async (bookingId) => {
    try {
      const form = reviewForms[bookingId];
      if (!form?.rating) return toast.error(t('dashboard.pleaseSelectRating'));
      await createReview(bookingId, { rating: form.rating, comment: form.comment });
      toast.success(t('dashboard.reviewSubmitted'));
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.couldNotSubmitReview'));
    }
  };

  const handleChatWithPerson = async (personId) => {
    if (!personId) return;
    try {
      const { data } = await initiateChat({ recipientId: personId });
      navigate('/messages', { state: { chatId: data.data._id } });
    } catch (error) {
      toast.error(error.response?.data?.message || t('search.couldNotStartChat'));
    }
  };

  // Stats
  const activeBookingsCount = useMemo(() => {
    return bookings.filter((b) => ['pending', 'accepted', 'in_progress'].includes(b.status)).length;
  }, [bookings]);

  const completedBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.status === 'completed').length;
  }, [bookings]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    if (activeStatusTab === 'active') {
      return bookings.filter((b) => ['pending', 'accepted', 'in_progress'].includes(b.status));
    }
    if (activeStatusTab === 'completed') {
      return bookings.filter((b) => b.status === 'completed');
    }
    return bookings;
  }, [bookings, activeStatusTab]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider border border-primary-100">
              <Sparkles size={13} />
              <span>{t('dashboard.customerDashboard')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              {t('dashboard.activitySubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/messages">
              <Button size="md" variant="outline" iconLeft={MessageSquare}>
                {t('common.chat')}
              </Button>
            </Link>
            <Link to="/search">
              <Button size="md" variant="primary" iconLeft={SearchIcon}>
                Book Service
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title={t('dashboard.activeServices', { defaultValue: 'Active Services' })}
            value={activeBookingsCount}
            icon={Clock3}
            subtitle={t('dashboard.inProgressSubtitle', { defaultValue: 'In progress or scheduled' })}
          />
          <StatCard
            title={t('dashboard.completedServices', { defaultValue: 'Completed Services' })}
            value={completedBookingsCount}
            icon={CheckCircle2}
            subtitle={t('dashboard.completedSubtitle', { defaultValue: 'Successfully finished' })}
          />
          <StatCard
            title={t('dashboard.totalBookings', { defaultValue: 'Total Bookings' })}
            value={bookings.length}
            icon={CalendarCheck}
            subtitle={t('dashboard.allTimeRequests', { defaultValue: 'All time requests' })}
          />
        </div>

        {/* Quick Service Discovery Section */}
        <Card variant="elevated" padding="lg" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t('dashboard.needToday')}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {t('dashboard.compareExperts')}
              </p>
            </div>

            <form
              onSubmit={handleServiceSearch}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 w-full lg:max-w-md"
            >
              <div className="flex items-center gap-2 flex-1 px-2.5">
                <SearchIcon size={16} className="text-slate-400 shrink-0" />
                <input
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  placeholder={t('dashboard.serviceSearchPlaceholder')}
                  className="w-full bg-transparent py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <VoiceSearchButton
                autoProceed
                onAutoProceed={handleVoiceServiceSearch}
                speakText={t('voice.searchingFor', { text: serviceQuery || t('dashboard.serviceSearchPlaceholder') })}
                className="shrink-0"
              />

              <Button type="submit" size="sm" variant="primary" className="shrink-0">
                {t('common.search')}
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ACTIVE_SERVICES.map(({ key, title, icon, bg }) => {
              const ServiceIcon = icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openServiceSearch(key)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 elevation-1 hover:border-primary-300 hover:-translate-y-0.5 transition-all text-left cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${bg}`}>
                    <ServiceIcon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-primary-700 transition-colors">
                      {t(`services.${key}`, { defaultValue: title })}
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-600">Available Near You</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Bookings Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-primary-600 shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {t('common.bookings')}
              </h2>
            </div>

            <Tabs
              activeTab={activeStatusTab}
              onChange={setActiveStatusTab}
              tabs={[
                { key: 'all', label: 'All Bookings', count: bookings.length },
                { key: 'active', label: 'Active', count: activeBookingsCount },
                { key: 'completed', label: 'Completed', count: completedBookingsCount }
              ]}
            />
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              title={t('dashboard.noBookings')}
              description={t('dashboard.requestsAppear')}
              actionLabel="Book a Service"
              onAction={() => navigate('/search')}
            />
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const otherPerson = user?.role === 'worker' ? booking.user : booking.worker;
                const destinationLocation = getBookingDestination(booking, user);

                return (
                  <Card
                    key={booking._id}
                    variant="elevated"
                    padding="md"
                    onClick={() => setSelectedBooking(booking)}
                    className="cursor-pointer space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 capitalize truncate">
                            {t(`services.${booking.service}`, { defaultValue: booking.service })}
                          </h3>
                          <Badge status={booking.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {t('dashboard.withAt', { name: otherPerson?.name || 'Worker', address: booking.address })}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        {booking.totalPrice && (
                          <p className="text-base font-extrabold text-slate-900">
                            {formatInr(booking.totalPrice)}
                          </p>
                        )}
                        <span className="text-[11px] font-bold text-slate-400 capitalize">
                          {t('dashboard.payment', { status: t(`status.${booking.paymentStatus}`, { defaultValue: booking.paymentStatus }) })}
                        </span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5 font-medium text-slate-500">
                        <Clock size={14} className="text-slate-400" />
                        <span>{format(new Date(booking.scheduledDate), 'PPp')}</span>
                      </p>

                      {otherPerson?.phone && (
                        <p className="flex items-center gap-1.5 text-primary-700 font-bold">
                          <Phone size={14} className="text-primary-600" />
                          <span>{t('dashboard.contact', { phone: otherPerson.phone })}</span>
                        </p>
                      )}
                    </div>

                    {/* Live Tracking map */}
                    {(booking.status === 'accepted' || booking.status === 'in_progress') && destinationLocation && (
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900">
                          <MapPin size={14} className="text-primary-600" />
                          <span>{t('dashboard.liveTracking')}</span>
                        </div>
                        <Suspense fallback={<div className="h-60 rounded-2xl bg-slate-100 animate-pulse" />}>
                          <TrackingMap
                            bookingId={booking._id}
                            destinationLocation={destinationLocation}
                            destinationAddress={booking.address}
                            destinationLabel={t('dashboard.destination')}
                          />
                        </Suspense>
                      </div>
                    )}

                    {/* OTP & Action Row */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {booking.status === 'accepted' && (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                placeholder={t('dashboard.workerOtp')}
                                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none w-32 font-bold"
                                value={otpInput[booking._id] || ''}
                                onChange={(e) => setOtpInput({ ...otpInput, [booking._id]: e.target.value })}
                              />
                            </div>
                            <Button size="sm" variant="primary" onClick={() => handleStartVerify(booking._id)}>
                              {t('dashboard.verifyStart')}
                            </Button>
                          </div>
                        )}

                        {booking.status === 'in_progress' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                            <span className="text-emerald-600 uppercase text-[10px]">{t('dashboard.tellWorkerOtp')}:</span>
                            <span className="font-mono text-sm tracking-wider">{booking.completionOTP}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {otherPerson?._id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleChatWithPerson(otherPerson._id)}
                            iconLeft={MessageSquare}
                          >
                            {t('common.chat')}
                          </Button>
                        )}

                        {['pending', 'accepted'].includes(booking.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => changeStatus(booking._id, 'cancelled')}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            {t('common.cancel')}
                          </Button>
                        )}

                        {booking.paymentStatus !== 'paid' && ['accepted', 'completed'].includes(booking.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changePayment(booking._id, 'paid')}
                            className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                          >
                            {t('dashboard.markPaid')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Review Form / Status */}
                    {booking.status === 'completed' && !booking.review && (
                      <div
                        className="grid sm:grid-cols-[130px_1fr_auto] gap-2.5 pt-3 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={reviewForms[booking._id]?.rating || 5}
                          onChange={(e) => setReviewForms({ ...reviewForms, [booking._id]: { ...reviewForms[booking._id], rating: Number(e.target.value) } })}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                        >
                          {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>{r} Stars</option>
                          ))}
                        </select>

                        <input
                          value={reviewForms[booking._id]?.comment || ''}
                          onChange={(e) => setReviewForms({ ...reviewForms, [booking._id]: { ...reviewForms[booking._id], comment: e.target.value } })}
                          placeholder={t('dashboard.shareReview')}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none"
                        />

                        <Button size="sm" variant="primary" onClick={() => submitReview(booking._id)}>
                          {t('dashboard.review')}
                        </Button>
                      </div>
                    )}

                    {booking.review && (
                      <div className="pt-2 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        <span>{t('dashboard.reviewed', { rating: booking.review.rating })}</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pt-4">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={(p) => fetchBookings(p)}
              />
            </div>
          )}
        </section>
      </main>

      <Suspense fallback={null}>
        <BookingDetailsModal
          booking={selectedBooking}
          viewerRole="user"
          onClose={() => setSelectedBooking(null)}
        />
      </Suspense>
    </div>
  );
};

export default Dashboard;
