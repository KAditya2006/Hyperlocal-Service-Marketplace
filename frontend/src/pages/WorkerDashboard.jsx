import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getBookings, getWorkerProfile, initiateChat, updateBookingStatus, updateWorkerProfile, uploadKYC, verifyCompletionOTP } from '../services/api';
import Navbar from '../components/Navbar';
import {
  LayoutDashboard,
  FileCheck,
  DollarSign,
  Briefcase,
  Star,
  Clock,
  CheckCircle2,
  Upload,
  User as UserIcon,
  XCircle,
  Key,
  MessageSquare,
  MapPin,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatInr } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { getBookingDestination } from '../utils/location';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/cards/StatCard';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';

const BookingDetailsModal = React.lazy(() => import('../components/BookingDetailsModal'));
const TrackingMap = React.lazy(() => import('../components/TrackingMap'));

const WorkerDashboard = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kycFiles, setKycFiles] = useState({ idProof: null });
  const [uploading, setUploading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [jobsPagination, setJobsPagination] = useState({ page: 1, pages: 1 });
  const [profileForm, setProfileForm] = useState({ skills: '', experience: 0, bio: '', amount: '', unit: 'hour', availabilityStatus: 'Available' });
  const [otpInput, setOtpInput] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const sectionParam = searchParams.get('section');
  const activeSection = sectionParam && ['overview', 'jobs', 'kyc', 'profile'].includes(sectionParam) ? sectionParam : 'overview';

  const setActiveSection = useCallback((section) => {
    setSearchParams({ section });
  }, [setSearchParams]);

  const navItems = useMemo(() => [
    { id: 'overview', label: t('common.dashboard'), icon: LayoutDashboard },
    { id: 'jobs', label: t('workerDashboard.myJobs'), icon: Briefcase },
    { id: 'messages', label: t('chat.messages'), icon: MessageSquare, isLink: true, href: '/messages' },
    { id: 'kyc', label: t('workerDashboard.kycVerification'), icon: FileCheck },
    { id: 'profile', label: t('workerDashboard.profileSettings'), icon: UserIcon },
  ], [t]);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await getWorkerProfile();
      setProfile(data.data);
      setProfileForm({
        skills: data.data.skills?.join(', ') || '',
        experience: data.data.experience || 0,
        bio: data.data.bio || '',
        amount: data.data.pricing?.amount || '',
        unit: data.data.pricing?.unit || 'hour',
        availabilityStatus: data.data.availabilityStatus || 'Available'
      });
    } catch {
      toast.error(t('workerDashboard.failedLoadProfile'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchBookings = useCallback(async (page = 1) => {
    try {
      const { data } = await getBookings({ page });
      setBookings(data.data);
      setJobsPagination(data.pagination);
    } catch {
      toast.error(t('workerDashboard.failedLoadJobs'));
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
    fetchBookings();
  }, [fetchBookings, fetchProfile]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateWorkerProfile({
        skills: profileForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        experience: Number(profileForm.experience),
        bio: profileForm.bio,
        availabilityStatus: profileForm.availabilityStatus,
        pricing: {
          amount: Number(profileForm.amount),
          unit: profileForm.unit
        }
      });
      toast.success(t('workerDashboard.profileUpdated'));
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || t('workerDashboard.profileUpdateFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCompletionVerify = async (bookingId) => {
    try {
      if (!otpInput[bookingId]) return toast.error(t('dashboard.pleaseEnterOtp'));
      await verifyCompletionOTP(bookingId, otpInput[bookingId]);
      toast.success(t('workerDashboard.jobCompleted'));
      fetchBookings(jobsPagination.page);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.invalidOtp'));
    }
  };

  const handleJobStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      toast.success(t('workerDashboard.jobUpdated'));
      fetchBookings(jobsPagination.page);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || t('workerDashboard.couldNotUpdateJob'));
    }
  };

  const handleCustomerChat = async (booking) => {
    const recipientId = booking.user?._id || booking.user?.id || booking.user;
    if (!recipientId) {
      toast.error(t('workerDashboard.customerUnavailable'));
      return;
    }

    try {
      const { data } = await initiateChat({ recipientId });
      navigate('/messages', { state: { chatId: data.data._id } });
    } catch (error) {
      toast.error(error.response?.data?.message || t('workerDashboard.couldNotOpenChat'));
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    if (!kycFiles.idProof) {
      toast.error(t('workerDashboard.selectIdProof'));
      return;
    }

    const formData = new FormData();
    formData.append('idProof', kycFiles.idProof);

    setUploading(true);
    try {
      const { data } = await uploadKYC(formData);

      toast.success(data.message || t('workerDashboard.kycSubmitted'));
      
      if (data && data.data) {
        setProfile(data.data);
        setUser(prev => ({ 
          ...prev, 
          kyc: data.data.kyc || { status: 'pending' } 
        }));
      } else {
        fetchProfile();
      }
      
      setActiveSection('overview');
    } catch (error) {
      const message = error.response?.data?.message || t('workerDashboard.kycUploadFailed');
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const completedJobs = useMemo(() => bookings.filter((booking) => booking.status === 'completed'), [bookings]);
  const estimatedEarnings = useMemo(() => completedJobs.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0), [completedJobs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center font-heading text-slate-400 font-bold">
          {t('workerDashboard.loadingDashboard')}
        </div>
      </div>
    );
  }

  const visibleSections = {
    overview: activeSection === 'overview',
    jobs: activeSection === 'jobs',
    kyc: activeSection === 'kyc',
    profile: activeSection === 'profile'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />
      
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8 min-w-0">
        {/* Desktop Sidebar Navigation (Hidden on mobile/tablet) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-2 min-w-0">
          <nav className="bg-white p-3 rounded-2xl sm:rounded-3xl border border-slate-200/80 elevation-1 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;

              if (item.isLink) {
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  >
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                    isActive ? 'bg-primary-50 text-primary-700 shadow-xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile / Tablet Clean Section Header (No duplicate hamburger button) */}
        <div className="lg:hidden flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 elevation-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">{t('common.workerPanel', { defaultValue: 'Worker Panel' })}</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-primary-700 capitalize truncate max-w-36 sm:max-w-none">
              {navItems.find((item) => item.id === activeSection)?.label || t('common.dashboard')}
            </span>
          </div>

          <Badge status={profile?.availabilityStatus || 'Available'} size="sm" showDot={true} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 sm:space-y-8 min-w-0">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider border border-primary-100">
                <Sparkles size={13} />
                <span>Worker Partner Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {profile?.user?.name || 'Worker Dashboard'}
              </h1>
            </div>

            <div className="hidden lg:block">
              <Badge status={profile?.availabilityStatus || 'Available'} size="md" showDot={true} />
            </div>
          </div>

          {/* KYC Status Banners */}
          {profile?.kyc?.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start gap-3.5">
              <Clock className="text-amber-600 mt-0.5 shrink-0" size={22} />
              <div>
                <h4 className="font-bold text-amber-900 text-sm sm:text-base">{t('workerDashboard.verificationProgress')}</h4>
                <p className="text-amber-700 text-xs sm:text-sm font-medium mt-0.5">{t('workerDashboard.verificationProgressCopy')}</p>
              </div>
            </div>
          )}

          {profile?.kyc?.status === 'rejected' && (
            <div className="bg-rose-50 border border-rose-200 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start gap-3.5">
              <XCircle className="text-rose-600 mt-0.5 shrink-0" size={22} />
              <div>
                <h4 className="font-bold text-rose-900 text-sm sm:text-base">{t('workerDashboard.verificationRejected')}</h4>
                <p className="text-rose-700 text-xs sm:text-sm font-medium mt-0.5">
                  {t('workerDashboard.rejectionReason', { reason: profile?.kyc?.rejectionReason || t('workerDashboard.documentsUnclear') })}
                </p>
              </div>
            </div>
          )}

          {profile?.approvalStatus === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start gap-3.5">
              <CheckCircle2 className="text-emerald-600 mt-0.5 shrink-0" size={22} />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm sm:text-base">{t('workerDashboard.accountVerified')}</h4>
                <p className="text-emerald-700 text-xs sm:text-sm font-medium mt-0.5">{t('workerDashboard.accountVerifiedCopy')}</p>
              </div>
            </div>
          )}

          {/* Metric Stat Cards */}
          {visibleSections.overview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <StatCard
                title={t('workerDashboard.totalEarnings')}
                value={formatInr(estimatedEarnings)}
                icon={DollarSign}
                trend="+12.5%"
              />
              <StatCard
                title={t('workerDashboard.jobsCompleted')}
                value={completedJobs.length}
                icon={Briefcase}
                subtitle="Successfully delivered"
              />
              <StatCard
                title={t('workerDashboard.avgRating')}
                value={profile?.averageRating ? profile.averageRating.toFixed(1) : '0.0'}
                icon={Star}
                subtitle={`from ${profile?.totalReviews || 0} reviews`}
              />
            </div>
          )}

          {/* KYC Upload Form */}
          {visibleSections.kyc && (profile?.kyc?.status === 'none' || profile?.kyc?.status === 'rejected') && (
            <Card variant="elevated" padding="lg" className="space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{t('workerDashboard.kycFlow')}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Upload your government ID proof to receive job requests.</p>
              </div>

              <form onSubmit={handleKycSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    kycFiles.idProof ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-primary-500 hover:bg-primary-50/30'
                  }`}>
                    {kycFiles.idProof ? <CheckCircle2 className="text-emerald-600 mb-3" size={32} /> : <Upload className="text-slate-400 mb-3" size={32} />}
                    <span className={`font-bold text-sm ${kycFiles.idProof ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {kycFiles.idProof ? kycFiles.idProof.name : t('workerDashboard.uploadIdProof')}
                    </span>
                    <input type="file" className="hidden" onChange={(e) => setKycFiles({ ...kycFiles, idProof: e.target.files[0] })} />
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={uploading}
                  loading={uploading}
                  fullWidth
                >
                  {uploading ? t('workerDashboard.processingDocuments') : t('workerDashboard.submitVerification')}
                </Button>
              </form>
            </Card>
          )}

          {/* Profile Overview Box */}
          {visibleSections.overview && (
            <Card variant="elevated" padding="lg" className="space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">{t('workerDashboard.publicProfile')}</h3>
              
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                <Avatar
                  src={profile?.user?.avatar}
                  alt={profile?.user?.name}
                  size="xl"
                />

                <div className="flex-1 space-y-4 min-w-0">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('workerDashboard.expertise')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile?.skills?.map((skill, i) => (
                          <span key={i} className="bg-primary-50 text-primary-700 px-3 py-0.5 rounded-full text-xs font-bold capitalize border border-primary-100">
                            {skill}
                          </span>
                        )) || <span className="text-slate-400 italic text-xs">{t('workerDashboard.noSkills')}</span>}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('workerDashboard.pricing')}</p>
                      <p className="text-base font-extrabold text-slate-900">
                        {formatInr(profile?.pricing?.amount)} / {profile?.pricing?.unit || t('workerDashboard.hour')}
                      </p>
                    </div>
                  </div>

                  {profile?.bio && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('workerDashboard.bio')}</p>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Profile Settings Form */}
          {visibleSections.profile && (
            <Card variant="elevated" padding="lg" className="space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">{t('workerDashboard.profileSettings')}</h3>

              <form onSubmit={handleProfileSubmit} className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Skills (comma separated)"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  placeholder={t('workerDashboard.skillsPlaceholder')}
                />

                <Input
                  label="Years of Experience"
                  type="number"
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                  placeholder={t('workerDashboard.experiencePlaceholder')}
                />

                <Input
                  label="Hourly / Fixed Rate (₹)"
                  type="number"
                  value={profileForm.amount}
                  onChange={(e) => setProfileForm({ ...profileForm, amount: e.target.value })}
                  placeholder={t('workerDashboard.pricePlaceholder')}
                />

                <Select
                  label="Pricing Unit"
                  value={profileForm.unit}
                  onChange={(e) => setProfileForm({ ...profileForm, unit: e.target.value })}
                  options={[
                    { value: 'hour', label: t('workerDashboard.perHour') },
                    { value: 'day', label: t('workerDashboard.perDay') },
                    { value: 'job', label: t('workerDashboard.perJob') }
                  ]}
                />

                <div className="sm:col-span-2 space-y-1.5 text-left">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700">{t('workerDashboard.bio')}</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder={t('workerDashboard.bio')}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <Select
                  label="Availability Status"
                  value={profileForm.availabilityStatus}
                  onChange={(e) => setProfileForm({ ...profileForm, availabilityStatus: e.target.value })}
                  options={[
                    { value: 'Available', label: t('common.available') },
                    { value: 'Offline', label: t('chat.offline') }
                  ]}
                />

                <div className="sm:col-span-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={savingProfile}
                    loading={savingProfile}
                  >
                    {savingProfile ? t('workerDashboard.saving') : t('workerDashboard.saveProfile')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Jobs List Section */}
          {visibleSections.jobs && (
            <Card variant="elevated" padding="lg" className="space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">{t('workerDashboard.myJobs')}</h3>

              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <EmptyState
                    title={t('workerDashboard.noJobs')}
                    description="Job requests from customers will appear here."
                  />
                ) : (
                  bookings.map((booking) => {
                    const destinationLocation = getBookingDestination(booking);
                    const canTrackDestination = ['accepted', 'in_progress'].includes(booking.status);

                    return (
                      <Card
                        key={booking._id}
                        variant="flat"
                        padding="md"
                        onClick={() => setSelectedBooking(booking)}
                        className="cursor-pointer space-y-4 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-base capitalize">{booking.service}</h4>
                              <Badge status={booking.status} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              Customer: <span className="text-slate-800 font-bold">{booking.user?.name}</span> · {format(new Date(booking.scheduledDate), 'PPp')}
                            </p>
                            <p className="text-xs text-slate-500">{booking.address}</p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-base font-extrabold text-slate-900">{formatInr(booking.totalPrice)}</p>
                            <span className="text-[11px] font-bold text-slate-400 capitalize">
                              {t('bookingDetails.paymentStatus', { status: t(`status.${booking.paymentStatus}`, { defaultValue: booking.paymentStatus }) })}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons & OTP verification */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
                          {booking.user && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCustomerChat(booking)}
                              iconLeft={MessageSquare}
                            >
                              {t('workerDashboard.chatCustomer')}
                            </Button>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <Button size="sm" variant="success" onClick={() => handleJobStatus(booking._id, 'accepted')}>
                                  {t('workerDashboard.accept')}
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleJobStatus(booking._id, 'rejected')}>
                                  {t('workerDashboard.reject')}
                                </Button>
                              </>
                            )}

                            {booking.status === 'accepted' && (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-800 border border-primary-100 text-xs font-bold">
                                <span className="text-primary-600 uppercase text-[10px]">{t('workerDashboard.tellUserOtp')}:</span>
                                <span className="font-mono text-sm tracking-wider">{booking.startOTP}</span>
                              </div>
                            )}

                            {booking.status === 'in_progress' && (
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input
                                    placeholder={t('workerDashboard.userOtp')}
                                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none w-28 font-bold"
                                    value={otpInput[booking._id] || ''}
                                    onChange={(e) => setOtpInput({ ...otpInput, [booking._id]: e.target.value })}
                                  />
                                </div>
                                <Button size="sm" variant="success" onClick={() => handleCompletionVerify(booking._id)}>
                                  {t('workerDashboard.verifyFinish')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Customer Live Tracking Map */}
                        {canTrackDestination && (
                          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900">
                              <MapPin size={14} className="text-primary-600" />
                              <span>{t('workerDashboard.customerServiceLocation')}</span>
                            </div>
                            <Suspense fallback={<div className="h-60 rounded-2xl bg-slate-100 animate-pulse" />}>
                              <TrackingMap
                                bookingId={booking._id}
                                destinationLocation={destinationLocation}
                                destinationAddress={booking.address}
                                destinationLabel={t('workerDashboard.customerDestination')}
                                viewerRole="worker"
                                shareWorkerLocation={Boolean(destinationLocation)}
                              />
                            </Suspense>
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>

              {jobsPagination.pages > 1 && (
                <div className="pt-4">
                  <Pagination
                    page={jobsPagination.page}
                    pages={jobsPagination.pages}
                    onPageChange={(p) => fetchBookings(p)}
                  />
                </div>
              )}
            </Card>
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <BookingDetailsModal
          booking={selectedBooking}
          viewerRole="worker"
          onClose={() => setSelectedBooking(null)}
        />
      </Suspense>
    </div>
  );
};

export default WorkerDashboard;
