import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPostAuthRedirect } from '../utils/onboarding';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error(t('auth.completeOtp'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await verifyOTP({ email, otp: otpCode });
      if (data.success) {
        toast.success(t('auth.emailVerifiedToast'));
        login(data.user, data.token);
        
        const redirectPath = getPostAuthRedirect(data.user);
        navigate(redirectPath, { state: redirectPath === '/profile' ? { onboarding: true } : undefined });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('dashboard.invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await resendOTP({ email });
      toast.success(t('auth.otpSentAgain'));
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch {
      toast.error(t('auth.failedResend'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/signup')}
          className="mb-6 flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> {t('auth.backToSignup')}
        </button>

        <Card variant="elevated" padding="lg" className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto border border-primary-100/60 shadow-xs">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('auth.verifyEmail')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 break-words">
                {t('auth.otpSent')} <span className="text-slate-900 font-bold">{email}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between gap-1.5 sm:gap-2">
              {otp.map((digit, i) => (
                <input 
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-10 h-13 sm:w-12 sm:h-15 text-center text-xl sm:text-2xl font-bold bg-white border border-slate-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              loading={loading}
            >
              {loading ? t('auth.verifying') : t('auth.verifyContinue')}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-500 font-medium">{t('auth.didNotReceive')}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={timer > 0}
              iconLeft={RefreshCcw}
              className="mx-auto"
            >
              {timer > 0 ? t('auth.resendIn', { seconds: timer }) : t('auth.resendNow')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;
