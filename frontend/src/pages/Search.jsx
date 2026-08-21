import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ServiceAddressInput from '../components/ServiceAddressInput';
import { createBooking, initiateChat, searchWorkers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getOnboardingMessage } from '../utils/onboarding';
import { getStoredUserCoordinates } from '../utils/location';
import VoiceSearchButton from '../components/VoiceSearchButton';
import { normalizeServiceSearch } from '../utils/multilingualSearch';
import SearchEmptyState from '../components/search/SearchEmptyState';
import WorkerSearchCard from '../components/search/WorkerSearchCard';
import { getSearchOrigin, getSuggestedServices, getWorkerSkills, isKnownButInactiveService, isListedService } from '../utils/serviceSearch';
import { getWorkerAvailabilityStatus } from '../utils/workerAvailability';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { CardSkeleton } from '../components/ui/Skeleton';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const initialQuery = new URLSearchParams(location.search).get('q') || '';
  const [filters, setFilters] = useState({ service: initialQuery, maxPrice: '', minRating: '' });
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [booking, setBooking] = useState({ service: initialQuery, scheduledDate: '', address: '', additionalNotes: '', coordinates: null });
  const searchedService = filters.service.trim();
  const searchedServiceIsListed = isListedService(searchedService);
  const suggestedServices = getSuggestedServices(searchedService);
  const searchOrigin = useMemo(() => getSearchOrigin(user), [user]);

  useEffect(() => {
    const query = normalizeServiceSearch(new URLSearchParams(location.search).get('q') || '');
    setFilters((current) => current.service === query ? current : { ...current, service: query, page: 1 });
    setBooking((current) => current.service === query ? current : { ...current, service: query });
  }, [location.search]);

  const fetchWorkers = useCallback(async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await searchWorkers({
        ...filters,
        service: normalizeServiceSearch(filters.service),
        page: filters.page || 1,
        ...(searchOrigin ? { lat: searchOrigin.lat, lng: searchOrigin.lng } : {})
      });
      setWorkers(data.data);
      setPagination(data.pagination);
      setServiceUnavailable(data.serviceUnavailable || isKnownButInactiveService(filters.service));
    } catch {
      toast.error(t('search.failed'));
    } finally {
      setLoading(false);
    }
  }, [filters, searchOrigin, t]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleChat = async (worker) => {
    if (!token) {
      navigate('/login', { state: { message: t('search.loginNeeded') } });
      return;
    }

    if (user?.role !== 'user') {
      toast.error(t('search.onlyCustomersChat'));
      return;
    }

    if (!user?.canAccessDashboard) {
      navigate('/profile', { state: { notice: getOnboardingMessage(user) } });
      return;
    }

    try {
      await initiateChat({ recipientId: worker.user._id });
      navigate('/messages');
    } catch {
      toast.error(t('search.couldNotStartChat'));
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorker) return;

    try {
      const workerSkills = getWorkerSkills(selectedWorker);
      await createBooking({
        workerId: selectedWorker.user._id,
        service: normalizeServiceSearch(booking.service) || workerSkills[0] || 'General service',
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        ...(booking.coordinates ? {
          serviceLocation: {
            coordinates: booking.coordinates,
            address: booking.address
          }
        } : {}),
        additionalNotes: booking.additionalNotes
      });
      toast.success(t('search.bookingSent'));
      setSelectedWorker(null);
      setBooking({ service: filters.service, scheduledDate: '', address: getDefaultAddress(), additionalNotes: '', coordinates: getDefaultCoordinates() });
    } catch (error) {
      toast.error(error.response?.data?.message || t('search.bookingFailed'));
    }
  };

  const openBooking = (worker) => {
    if (!token) {
      navigate('/login', { state: { message: t('search.loginNeeded') } });
      return;
    }

    if (user?.role !== 'user') {
      toast.error(t('search.onlyCustomersBook'));
      return;
    }

    const availabilityStatus = getWorkerAvailabilityStatus(worker);
    if (availabilityStatus !== 'Available') {
      toast.error(t('search.workerUnavailable', { status: availabilityStatus.toLowerCase() }));
      return;
    }

    const workerSkills = getWorkerSkills(worker);
    setSelectedWorker(worker);
    setBooking((current) => ({
      ...current,
      service: filters.service || workerSkills[0] || '',
      address: current.address || getDefaultAddress(),
      coordinates: current.coordinates || getDefaultCoordinates()
    }));
  };

  const getDefaultAddress = () => {
    return [user?.location?.homeNumber, user?.location?.address].filter(Boolean).join(', ');
  };

  const getDefaultCoordinates = () => getStoredUserCoordinates(user);

  const searchService = (service) => {
    navigate(`/search?q=${encodeURIComponent(normalizeServiceSearch(service))}`);
  };

  const handleVoiceSearch = (text, voiceContext = {}) => {
    const query = voiceContext.normalizedQuery || normalizeServiceSearch(text);
    setFilters((current) => ({ ...current, service: query, page: 1 }));
    setBooking((current) => ({ ...current, service: query }));
    navigate(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <section className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('search.title')}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            {t('search.subtitle')}
          </p>
        </section>

        {/* Filter Bar */}
        <form
          onSubmit={fetchWorkers}
          className="bg-white border border-slate-200/80 elevation-1 rounded-2xl sm:rounded-3xl p-3 sm:p-4 grid lg:grid-cols-[minmax(0,1fr)_auto_160px_160px_auto] gap-3"
        >
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 min-w-0">
            <SearchIcon size={18} className="text-slate-400 shrink-0" />
            <input
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value, page: 1 })}
              placeholder={t('search.servicePlaceholder')}
              className="w-full min-w-0 bg-transparent py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
            {filters.service && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, service: '', page: 1 })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <VoiceSearchButton
            autoProceed
            onAutoProceed={handleVoiceSearch}
            speakText={t('voice.searchingFor', { text: filters.service || t('search.servicePlaceholder') })}
            className="w-full justify-center min-[420px]:w-auto"
          />

          <input
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })}
            placeholder={t('search.maxPrice')}
            type="number"
            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />

          <input
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: e.target.value, page: 1 })}
            placeholder={t('search.minRating')}
            type="number"
            min="0"
            max="5"
            step="0.5"
            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full lg:w-auto px-6"
          >
            {t('common.search')}
          </Button>
        </form>

        {/* Results Grid */}
        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : workers.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <SearchEmptyState
                searchedService={searchedService}
                searchedServiceIsListed={searchedServiceIsListed}
                serviceUnavailable={serviceUnavailable}
                suggestedServices={suggestedServices}
                onSearchService={searchService}
                t={t}
              />
            </div>
          ) : (
            workers.map((worker) => (
              <WorkerSearchCard
                key={worker._id}
                worker={worker}
                onChat={handleChat}
                onBook={openBooking}
                t={t}
              />
            ))
          )}
        </section>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pt-4">
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={(p) => setFilters({ ...filters, page: p })}
            />
          </div>
        )}
      </main>

      {/* Booking Modal */}
      <Modal
        isOpen={Boolean(selectedWorker)}
        onClose={() => setSelectedWorker(null)}
        title={selectedWorker ? t('search.bookWorker', { name: selectedWorker.user?.name }) : ''}
        subtitle={t('search.bookingSubtitle')}
      >
        {selectedWorker && (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <Input
              required
              label={t('search.service')}
              value={booking.service}
              onChange={(e) => setBooking({ ...booking, service: e.target.value })}
              placeholder={t('search.service')}
            />

            <Input
              required
              type="datetime-local"
              label="Scheduled Date & Time"
              value={booking.scheduledDate}
              onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })}
            />

            <ServiceAddressInput
              value={booking.address}
              onChange={({ address, coordinates }) => setBooking({ ...booking, address, coordinates })}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                {t('search.notes')}
              </label>
              <textarea
                value={booking.additionalNotes}
                onChange={(e) => setBooking({ ...booking, additionalNotes: e.target.value })}
                placeholder={t('search.notes')}
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedWorker(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {t('common.sendRequest')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SearchPage;
