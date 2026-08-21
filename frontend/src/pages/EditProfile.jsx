import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updateAvatar } from '../services/api';
import { User, Phone, Home, ArrowLeft, Camera, Loader2, Save } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import toast from 'react-hot-toast';
import { getDashboardPath } from '../utils/onboarding';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const toStoredCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;
  const [lat, lng] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return [lng, lat];
};

const EditProfile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    homeNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.location?.address || '',
        homeNumber: user.location?.homeNumber || '',
      });
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('editProfile.imageTooLarge'));
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const { data } = await updateAvatar(uploadData);
      if (data.success) {
        toast.success(t('backend.avatarUpdated'));
        setUser({ ...user, avatar: data.avatar });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('editProfile.imageUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await updateProfile(formData);
      if (data.success) {
        toast.success(t('backend.profileUpdated'));
        setUser(data.user);

        if (data.user?.canAccessDashboard && data.user?.role !== 'admin') {
          navigate(getDashboardPath(data.user), { replace: true });
        } else {
          navigate('/profile', { state: { onboarding: true } });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('editProfile.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 min-w-0">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> {t('editProfile.backToProfile')}
        </button>

        <Card variant="elevated" padding="lg" className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 min-w-0">
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('profile.editProfile')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">{t('editProfile.subtitle')}</p>
            </div>

            {/* Avatar Upload Dropzone */}
            <div className="relative group self-center sm:self-auto shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center relative shadow-xs">
                <img 
                  src={user?.avatar || '/avatar.svg'} 
                  alt={user?.name}
                  className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-30' : 'opacity-100'}`}
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="text-primary-600 animate-spin" size={24} />
                  </div>
                )}
              </div>
              <label 
                className="absolute -bottom-2 -right-2 p-2 bg-primary-600 text-white rounded-xl cursor-pointer hover:bg-primary-700 transition-all shadow-md active:scale-95 flex items-center justify-center"
                title={t('editProfile.changePhoto')}
              >
                <Camera size={15} />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                required
                label={t('auth.fullName')}
                iconLeft={User}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                type="tel"
                label={t('auth.phone')}
                iconLeft={Phone}
                placeholder={t('editProfile.phonePlaceholder')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                {t('auth.location')}
              </label>
              <AddressAutocomplete 
                value={formData.address}
                onChange={({ address, coordinates }) => setFormData({
                  ...formData, 
                  address,
                  coordinates: toStoredCoordinates(coordinates)
                })}
                placeholder={t('editProfile.locationPlaceholder')}
              />
            </div>

            {user?.role === 'user' && (
              <Input
                label={t('editProfile.homeAptNumber')}
                placeholder={t('editProfile.homePlaceholder')}
                iconLeft={Home}
                value={formData.homeNumber}
                onChange={(e) => setFormData({ ...formData, homeNumber: e.target.value })}
              />
            )}

            <div className="pt-4 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                loading={loading}
                iconLeft={Save}
                className="w-full sm:w-auto px-8"
              >
                {loading ? t('editProfile.savingChanges') : t('editProfile.saveChanges')}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default EditProfile;
