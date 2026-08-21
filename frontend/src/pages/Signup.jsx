import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { User, Mail, Lock, Phone, Briefcase, ArrowRight, Home, Clock } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';
import { PROFESSIONS } from '../constants/professions';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getPostAuthRedirect } from '../utils/onboarding';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const toStoredCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;
  const [lat, lng] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return [lng, lat];
};

const Signup = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '',
    role: 'user',
    address: '',
    homeNumber: '',
    professions: [],
    experience: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    if (token && user) {
      navigate(getPostAuthRedirect(user), { replace: true });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerUser({ ...formData, preferredLanguage: i18n.resolvedLanguage || i18n.language });
      if (data.success) {
        toast.success(data.message);
        navigate('/verify-otp', { state: { email: formData.email } });
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || t('auth.registrationFailed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Marketing Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="inline-flex" aria-label={t('navbar.instantHome')}>
            <BrandLogo light />
          </Link>
          <div className="mt-20 max-w-lg space-y-4">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white font-heading leading-tight tracking-tight">
              {t('auth.createAccount')}
            </h2>
            <p className="text-primary-100 text-lg leading-relaxed">
              {t('auth.joinText')}
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
            <h4 className="text-white font-extrabold text-2xl">5,000+</h4>
            <p className="text-primary-100 text-xs mt-1">{t('home.verifiedPros')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
            <h4 className="text-white font-extrabold text-2xl">10,000+</h4>
            <p className="text-primary-100 text-xs mt-1">Happy Households</p>
          </div>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-w-0">
        <div className="w-full max-w-md min-w-0">
          <Card variant="elevated" padding="lg" className="space-y-6">
            <div className="text-center space-y-2">
              <Link to="/" className="inline-flex lg:hidden mb-2" aria-label={t('navbar.instantHome')}>
                <BrandLogo />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('auth.createAccount')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">{t('auth.joinText')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl gap-1">
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    formData.role === 'user'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t('auth.customerRole')}
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'worker' })}
                  className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    formData.role === 'worker'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t('auth.workerRole')}
                </button>
              </div>

              <Input
                required
                label={t('auth.fullName')}
                placeholder={t('auth.fullName')}
                iconLeft={User}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

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

              <Input
                required
                type="tel"
                label={t('auth.phone')}
                placeholder={t('auth.phone')}
                iconLeft={Phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  {t('auth.location')} <span className="text-rose-500">*</span>
                </label>
                <AddressAutocomplete 
                  value={formData.address}
                  onChange={({ address, coordinates }) => setFormData({
                    ...formData, 
                    address,
                    location: { ...formData.location, coordinates: toStoredCoordinates(coordinates) }
                  })}
                  placeholder={t('auth.location')}
                />
              </div>

              {formData.role === 'user' && (
                <Input
                  required
                  label={t('auth.homeNumber')}
                  placeholder={t('auth.homeNumber')}
                  iconLeft={Home}
                  value={formData.homeNumber}
                  onChange={(e) => setFormData({ ...formData, homeNumber: e.target.value })}
                />
              )}

              {formData.role === 'worker' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Briefcase size={15} />
                      <span>{t('auth.chooseProfessions')}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                      {PROFESSIONS.map((prof) => {
                        const isSelected = formData.professions.includes(prof);
                        return (
                          <button
                            key={prof}
                            type="button"
                            onClick={() => {
                              const newProfs = isSelected
                                ? formData.professions.filter(p => p !== prof)
                                : [...formData.professions, prof];
                              setFormData({ ...formData, professions: newProfs });
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              isSelected 
                                ? 'bg-primary-600 text-white border-primary-600 shadow-xs' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                            }`}
                          >
                            {t(`services.${prof}`, { defaultValue: prof.charAt(0).toUpperCase() + prof.slice(1) })}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <Input
                    required
                    type="number"
                    label={t('auth.experience')}
                    placeholder={t('auth.experience')}
                    iconLeft={Clock}
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700">{t('auth.bio')}</label>
                    <textarea 
                      required
                      placeholder={t('auth.bio')}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>
              )}

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
                {loading ? t('auth.creatingAccount') : t('auth.registerNow')}
              </Button>
            </form>

            <p className="text-center text-xs sm:text-sm text-slate-500 font-medium pt-2 border-t border-slate-100">
              {t('auth.alreadyAccount')}{' '}
              <Link to="/login" className="text-primary-600 font-bold hover:underline">
                {t('auth.logIn')}
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
