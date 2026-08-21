import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import Navbar from '../components/Navbar';

import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/onboarding';

const NotFound = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="min-h-[calc(100vh-80px)] flex items-center px-4 py-16">
        <section className="max-w-5xl mx-auto w-full grid lg:grid-cols-[0.85fr_1.15fr] gap-10 items-center">
          <div className="space-y-6">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{t('notFound.eyebrow')}</p>
            <h1 className="text-4xl sm:text-5xl font-bold font-heading text-slate-950 leading-tight">
              {t('notFound.title')}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              {t('notFound.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={user ? getDashboardPath(user) : '/'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800 transition-colors"
              >
                <Home size={18} />
                {user && user.role !== 'user' ? t('common.dashboard') : t('notFound.goHome')}
              </Link>
              {(!user || user.role === 'user') && (
                <Link
                  to="/search"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:border-slate-500 transition-colors"
                >
                  <Search size={18} />
                  {t('notFound.findServices')}
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="text-[88px] sm:text-[120px] font-black leading-none tracking-tight text-slate-100">
              404
            </div>
            <div className="mt-6 grid gap-3">
              <Link to="/login" className="flex items-center justify-between rounded-lg border border-slate-200 p-4 font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
                {t('notFound.loginAccount')}
                <ArrowLeft className="rotate-180" size={18} />
              </Link>
              <Link to="/signup" className="flex items-center justify-between rounded-lg border border-slate-200 p-4 font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
                {t('notFound.createAccount')}
                <ArrowLeft className="rotate-180" size={18} />
              </Link>
              <Link to="/profile" className="flex items-center justify-between rounded-lg border border-slate-200 p-4 font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
                {t('notFound.openProfile')}
                <ArrowLeft className="rotate-180" size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NotFound;
