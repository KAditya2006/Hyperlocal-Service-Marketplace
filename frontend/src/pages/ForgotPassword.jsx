import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/api';
import { ArrowLeft, KeyRound, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await forgotPassword({ email });
      toast.success(data.message);
      setCodeSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || t('forgotPassword.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword({ email, token, password });
      toast.success(t('forgotPassword.updated'));
      setToken('');
      setPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || t('forgotPassword.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> {t('forgotPassword.backToLogin')}
        </Link>

        <Card variant="elevated" padding="lg" className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto border border-primary-100/60 shadow-xs">
              <KeyRound size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('forgotPassword.title')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t('forgotPassword.subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={codeSent ? handleReset : handleRequest} className="space-y-4">
            <Input
              required
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.email')}
              iconLeft={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {codeSent && (
              <>
                <Input
                  required
                  label={t('forgotPassword.resetCode')}
                  placeholder={t('forgotPassword.resetCode')}
                  iconLeft={KeyRound}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />

                <Input
                  required
                  type="password"
                  minLength={6}
                  label={t('forgotPassword.newPassword')}
                  placeholder={t('forgotPassword.newPassword')}
                  iconLeft={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              loading={loading}
              className="mt-2"
            >
              {loading
                ? t('forgotPassword.pleaseWait')
                : codeSent
                ? t('forgotPassword.updatePassword')
                : t('forgotPassword.sendResetCode')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
