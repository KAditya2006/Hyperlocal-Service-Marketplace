import React, { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion as Motion } from 'framer-motion';
import {
  Search,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Droplets,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import VoiceSearchButton from '../components/VoiceSearchButton';
import { normalizeServiceSearch } from '../utils/multilingualSearch';
import { Button } from '../components/ui/Button';
import { ServiceCard } from '../components/cards/ServiceCard';
import isServiceActive from '../../../shared/serviceAvailability.json';

const ACTIVE_SERVICES = [
  {
    key: 'electrician',
    title: 'Electrician',
    description: 'Expert wiring, appliance repair, fuse fixes, and electrical maintenance.',
    icon: Zap
  },
  {
    key: 'plumber',
    title: 'Plumber',
    description: 'Pipe repairs, leakage fixes, bathroom fittings, and drain clearance.',
    icon: Droplets
  },
  {
    key: 'home tutors',
    title: 'Home Tutor',
    description: 'Qualified tutors for school subjects, exam prep, and specialized learning.',
    icon: BookOpen
  }
];

const SECONDARY_SERVICES = [
  { key: 'carpenters', title: 'Carpenters' },
  { key: 'painters', title: 'Painters' },
  { key: 'house cleaner', title: 'House Cleaner' },
  { key: 'ac repair/service', title: 'AC Repair' }
];

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const normalizedQuery = normalizeServiceSearch(query);
    navigate(`/search${normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : ''}`);
  };

  const handleVoiceSearch = useCallback((text, voiceContext = {}) => {
    const normalizedQuery = voiceContext.normalizedQuery || normalizeServiceSearch(text);
    setQuery(text);
    navigate(`/search${normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : ''}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-100 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} className="text-primary-600" />
                <span>Instant & Verified Local Services</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t('home.heroTitle')}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                {t('home.heroSubtitle')}
              </p>

              {/* Universal Search Bar */}
              <form
                onSubmit={handleSearch}
                className="bg-white p-2.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 elevation-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 max-w-2xl mx-auto text-left"
              >
                <div className="flex-1 flex items-center gap-3 px-3 py-2">
                  <Search size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder={t('home.servicePlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full text-slate-900 outline-none text-sm sm:text-base font-medium placeholder:text-slate-400"
                  />
                </div>

                <VoiceSearchButton
                  autoProceed
                  onAutoProceed={handleVoiceSearch}
                  speakText={t('voice.searchingFor', { text: query || t('common.searchServices') })}
                  className="w-full justify-center md:w-auto"
                />

                <div className="hidden md:block w-px h-8 bg-slate-200" />

                <div className="flex-1 flex items-center gap-3 px-3 py-2">
                  <MapPin size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder={t('home.locationPlaceholder')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-slate-900 outline-none text-sm sm:text-base font-medium placeholder:text-slate-400"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full md:w-auto px-6 py-3 shrink-0"
                >
                  {t('common.search')}
                </Button>
              </form>
            </Motion.div>
          </div>
        </section>

        {/* Active Marketplace Services Grid */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live & Available</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {t('home.categoryGrid')}
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/search')}
              iconRight={ArrowRight}
            >
              Browse All Services
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ACTIVE_SERVICES.map((srv) => (
              <ServiceCard
                key={srv.key}
                serviceKey={srv.key}
                title={t(`services.${srv.key}`, { defaultValue: srv.title })}
                description={srv.description}
                isActive={isServiceActive[srv.key] !== false}
                onSelect={() => navigate(`/search?q=${encodeURIComponent(srv.key)}`)}
                actionLabel={t('common.findWorkers', { defaultValue: 'Find Workers' })}
              />
            ))}
          </div>

          {/* Secondary / Upcoming Services preview */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              More Services Expanding Soon
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {SECONDARY_SERVICES.map((srv) => (
                <button
                  key={srv.key}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(srv.key)}`)}
                  className="px-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-all cursor-pointer shadow-xs"
                >
                  {t(`services.${srv.key}`, { defaultValue: srv.title })}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Guarantee Section */}
        <section className="py-16 sm:py-20 bg-slate-900 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 items-center gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} />
                <span>InstantSeva Trust Promise</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Verified professionals you can rely on, every single time.
              </h2>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Every worker on InstantSeva undergoes government-backed KYC verification, skill validation, and continuous community rating checks before taking on jobs.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="font-bold text-white text-sm">100% KYC Verified</h4>
                  <p className="text-xs text-slate-400">Strict document checks and identity verification.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <h4 className="font-bold text-white text-sm">Fast Dispatch</h4>
                  <p className="text-xs text-slate-400">Connect with nearby workers in minutes.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-md bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 elevation-3 space-y-6">
                <h3 className="text-lg font-bold text-white">Need a Service Right Now?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Join thousands of satisfied households and find the best verified service workers in your locality.
                </p>
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/search')}
                  >
                    Find Service
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    onClick={() => navigate('/signup?role=worker')}
                    className="text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    Become a Worker Partner
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
