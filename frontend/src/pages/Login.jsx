import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser, resendOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';
import { getPostAuthRedirect } from '../utils/onboarding';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, token } = useAuth();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (token && user) {
      navigate(getPostAuthRedirect(user), { replace: true });
    }
  }, [token, user, navigate]);

  React.useEffect(() => {
    if (location.state?.message) {
      toast.error(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(formData);
      if (data.success) {
        toast.success(t('auth.welcomeToast'));
        login(data.user, data.token);
        
        const redirectPath = getPostAuthRedirect(data.user);
        navigate(redirectPath, { state: redirectPath === '/profile' ? { onboarding: true } : undefined });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const normalizedEmail = formData.email.trim().toLowerCase();

      if (error.response?.status === 403 && message.toLowerCase().includes('verify')) {
        try {
          await resendOTP({ email: normalizedEmail });
          toast.success(t('auth.pleaseVerifyOtpSent'));
        } catch {
          toast.error(message);
        }

        navigate('/verify-otp', { state: { email: normalizedEmail } });
        return;
      }

      toast.error(message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Card variant="elevated" padding="lg" className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-3">
            <Link to="/" className="inline-flex justify-center" aria-label={t('navbar.instantHome')}>
              <BrandLogo />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('auth.welcomeBack')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t('auth.signInSubtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              required
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.email')}
              iconLeft={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              required
              type="password"
              label={t('auth.password')}
              placeholder={t('auth.password')}
              iconLeft={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" />
                <span>{t('auth.rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-primary-600 font-bold hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              loading={loading}
              iconRight={ArrowRight}
              className="mt-4"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <p className="text-center text-xs sm:text-sm text-slate-500 font-medium pt-2 border-t border-slate-100">
            {t('auth.newHere')}{' '}
            <Link to="/signup" className="text-primary-600 font-bold hover:underline">
              {t('auth.createAccountLink')}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
