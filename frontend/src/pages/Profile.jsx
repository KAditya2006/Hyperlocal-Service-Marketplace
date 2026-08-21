import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCurrentUser, uploadKYC as uploadWorkerKYC, uploadUserKYC } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, Clock, XCircle, ShieldCheck, MapPin, Phone, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboardPath, getOnboardingMessage, getVerificationSource } from '../utils/onboarding';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const Profile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [kycFiles, setKycFiles] = useState({ idProof: null });
  const [uploading, setUploading] = useState(false);
  const verification = getVerificationSource(user);
  const verificationStatus = user?.verificationStatus || verification?.status || 'none';
  const onboardingMessage = location.state?.notice || getOnboardingMessage(user);
  const isOnboardingVisit = Boolean(location.state?.onboarding || location.state?.notice);

  const refreshUserStatus = useCallback(async ({ silent = false } = {}) => {
    try {
      const { data } = await getCurrentUser();
      setUser(data.user);

      if (data.user?.canAccessDashboard) {
        if (!silent) toast.success(t('profile.verificationApproved'));
        navigate(getDashboardPath(data.user), { replace: true });
        return;
      }

      if (!silent) toast.success(t('profile.statusRefreshed'));
    } catch {
      if (!silent) toast.error(t('profile.refreshFailed'));
    }
  }, [navigate, setUser, t]);

  useEffect(() => {
    if (user?.canAccessDashboard && isOnboardingVisit) {
      navigate(getDashboardPath(user), { replace: true });
    }
  }, [isOnboardingVisit, navigate, user]);

  useEffect(() => {
    if (user?.canAccessDashboard || user?.role === 'admin') return undefined;

    const interval = setInterval(() => {
      refreshUserStatus({ silent: true });
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshUserStatus, user?.canAccessDashboard, user?.role]);

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    if (!kycFiles.idProof) {
      return toast.error(t('profile.selectIdProof'));
    }

    const formData = new FormData();
    formData.append('idProof', kycFiles.idProof);

    setUploading(true);
    try {
      const uploadIdentity = user?.role === 'worker' ? uploadWorkerKYC : uploadUserKYC;
      const { data } = await uploadIdentity(formData);

      toast.success(data.message || t('profile.kycSubmitted'));

      const refreshed = await getCurrentUser();
      setUser(refreshed.data.user);

    } catch (error) {
      toast.error(error.response?.data?.message || t('profile.verificationUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8 min-w-0">
        {/* User Identity Card */}
        <Card variant="elevated" padding="lg" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-5 sm:gap-6 md:items-center justify-between min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
              <Avatar
                src={user?.avatar}
                alt={user?.name || t('common.profile')}
                size="xl"
                isOnline={user?.isOnline}
                showPresence={true}
              />

              <div className="space-y-1.5 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
                  {user?.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">{user?.email}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge status={user?.role} size="sm" />
                  {user?.phone && (
                    <span className="bg-slate-100 text-slate-700 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                      <Phone size={11} /> {user.phone}
                    </span>
                  )}
                  {user?.location?.city && (
                    <span className="bg-slate-100 text-slate-700 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                      <MapPin size={11} /> {user.location.city} {user.location.pincode && `(${user.location.pincode})`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/profile/edit')}
              >
                {t('profile.editProfile')}
              </Button>
              <LanguageSwitcher />
            </div>
          </div>
        </Card>

        {/* Onboarding / Dashboard Status Banner */}
        {user?.role !== 'admin' && (
          <div className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 ${
            user?.canAccessDashboard
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex min-w-0 items-start gap-4">
              <div className={`p-3 rounded-2xl ${user?.canAccessDashboard ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {user?.canAccessDashboard ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div className="space-y-0.5">
                <h2 className={`text-base sm:text-lg font-bold ${user?.canAccessDashboard ? 'text-emerald-950' : 'text-amber-950'}`}>
                  {user?.canAccessDashboard ? t('profile.dashboardUnlocked') : t('profile.dashboardLocked')}
                </h2>
                <p className={`text-xs sm:text-sm font-medium ${user?.canAccessDashboard ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {onboardingMessage}
                </p>
              </div>
            </div>

            {user?.canAccessDashboard && (
              <Button
                variant="success"
                size="md"
                onClick={() => navigate(getDashboardPath(user))}
                className="shrink-0"
              >
                {t('profile.openDashboard')}
              </Button>
            )}

            {!user?.canAccessDashboard && (
              <Button
                variant="outline"
                size="md"
                onClick={refreshUserStatus}
                className="shrink-0 bg-white"
              >
                {t('profile.refreshStatus')}
              </Button>
            )}
          </div>
        )}

        {/* KYC Verification Card */}
        <Card variant="elevated" padding="lg" className="space-y-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-primary-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t('profile.accountVerification')}
            </h2>
          </div>

          <div className="bg-slate-50/80 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 space-y-6">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${
                verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-600' : 
                verificationStatus === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {verificationStatus === 'verified' ? <CheckCircle2 size={20} /> : 
                 verificationStatus === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {user?.canAccessDashboard ? t('profile.dashboardApproved') :
                   verificationStatus === 'verified' ? t('profile.adminApprovalPending') : 
                   verificationStatus === 'pending' ? t('profile.verificationPending') : 
                   verificationStatus === 'rejected' ? t('profile.verificationRejected') : t('profile.verificationRequired')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {user?.canAccessDashboard
                    ? t('profile.verifiedOpenDashboard')
                    : verificationStatus === 'verified' 
                    ? t('profile.documentVerifiedAdminPending') 
                    : verificationStatus === 'pending' 
                    ? t('profile.reviewingDocuments') 
                    : verificationStatus === 'rejected'
                    ? t('profile.rejectionReason', { reason: verification?.rejectionReason || t('profile.clearerDocuments') })
                    : t('profile.uploadProofToUnlock')}
                </p>
              </div>
            </div>

            {(!verificationStatus || verificationStatus === 'none' || verificationStatus === 'rejected') && (
              <form onSubmit={handleKycSubmit} className="space-y-4 pt-2">
                <label className={`border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  kycFiles.idProof ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-300 hover:border-primary-400'
                }`}>
                  <Upload size={24} className={kycFiles.idProof ? 'text-emerald-600' : 'text-slate-400'} />
                  <span className={`text-xs sm:text-sm font-bold ${kycFiles.idProof ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {kycFiles.idProof ? kycFiles.idProof.name : t('profile.chooseIdProof')}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setKycFiles({ ...kycFiles, idProof: e.target.files[0] })}
                  />
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={uploading}
                  loading={uploading}
                  fullWidth
                >
                  {uploading ? t('profile.uploadingDocuments') : t('profile.submitVerificationDocuments')}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
