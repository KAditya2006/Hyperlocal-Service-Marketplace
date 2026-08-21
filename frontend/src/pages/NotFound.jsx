import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/onboarding';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const NotFound = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold uppercase tracking-wider">
              {t('notFound.eyebrow')}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t('notFound.title')}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
              {t('notFound.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to={user ? getDashboardPath(user) : '/'}>
                <Button variant="primary" size="md" iconLeft={Home}>
                  {user && user.role !== 'user' ? t('common.dashboard') : t('notFound.goHome')}
                </Button>
              </Link>

              {(!user || user.role === 'user') && (
                <Link to="/search">
                  <Button variant="outline" size="md" iconLeft={Search}>
                    {t('notFound.findServices')}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <Card variant="elevated" padding="lg" className="space-y-6">
            <div className="text-7xl sm:text-8xl font-black text-slate-200 tracking-tight select-none">
              404
            </div>

            <div className="space-y-2.5">
              <Link
                to="/login"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-primary-300 hover:text-primary-700 transition-all font-semibold text-xs sm:text-sm text-slate-700 shadow-xs"
              >
                <span>{t('notFound.loginAccount')}</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/signup"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-primary-300 hover:text-primary-700 transition-all font-semibold text-xs sm:text-sm text-slate-700 shadow-xs"
              >
                <span>{t('notFound.createAccount')}</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-primary-300 hover:text-primary-700 transition-all font-semibold text-xs sm:text-sm text-slate-700 shadow-xs"
              >
                <span>{t('notFound.openProfile')}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
