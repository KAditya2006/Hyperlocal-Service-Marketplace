import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ServiceAddressInput from '../components/ServiceAddressInput';
import { createBooking, initiateChat, searchWorkers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <section>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">{t('search.title')}</h1>
          <p className="text-slate-500 mt-2">{t('search.subtitle')}</p>
        </section>

        <form onSubmit={fetchWorkers} className="bg-white border border-slate-100 premium-shadow rounded-3xl p-3 sm:p-4 grid lg:grid-cols-[minmax(0,1fr)_auto_180px_180px_auto] gap-3 min-w-0">
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 min-w-0">
            <SearchIcon size={18} className="text-slate-400" />
            <input
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value, page: 1 })}
              placeholder={t('search.servicePlaceholder')}
              className="w-full min-w-0 bg-transparent py-4 outline-none font-medium"
            />
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
            className="bg-slate-50 rounded-2xl px-4 py-4 outline-none font-medium"
          />
          <input
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: e.target.value, page: 1 })}
            placeholder={t('search.minRating')}
            type="number"
            min="0"
            max="5"
            step="0.5"
            className="bg-slate-50 rounded-2xl px-4 py-4 outline-none font-medium"
          />
          <button className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-700">
            {t('common.search')}
          </button>
        </form>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="md:col-span-2 xl:col-span-3 text-center py-20 text-slate-400 font-bold">{t('search.searching')}</div>
          ) : workers.length === 0 ? (
            <SearchEmptyState
              searchedService={searchedService}
              searchedServiceIsListed={searchedServiceIsListed}
              serviceUnavailable={serviceUnavailable}
              suggestedServices={suggestedServices}
              onSearchService={searchService}
              t={t}
            />
          ) : workers.map((worker) => (
            <WorkerSearchCard
              key={worker._id}
              worker={worker}
              onChat={handleChat}
              onBook={openBooking}
              t={t}
            />
          ))}
        </section>

        {pagination.pages > 1 && (
          <div className="flex flex-wrap justify-center gap-3">
            <button disabled={pagination.page <= 1} onClick={() => setFilters({ ...filters, page: pagination.page - 1 })} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">{t('common.previous')}</button>
            <span className="px-5 py-3 text-slate-500 font-bold">{t('common.page', { page: pagination.page, pages: pagination.pages })}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => setFilters({ ...filters, page: pagination.page + 1 })} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">{t('common.next')}</button>
          </div>
        )}
      </main>

      {selectedWorker && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <form onSubmit={handleBookingSubmit} className="bg-white w-full max-w-lg rounded-3xl p-4 sm:p-8 premium-shadow space-y-5 max-h-[92vh] overflow-y-auto">
            <div>
              <h2 className="text-2xl font-bold font-heading text-slate-900">{t('search.bookWorker', { name: selectedWorker.user?.name })}</h2>
              <p className="text-slate-500">{t('search.bookingSubtitle')}</p>
            </div>
            <input required value={booking.service} onChange={(e) => setBooking({ ...booking, service: e.target.value })} placeholder={t('search.service')} className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            <input required value={booking.scheduledDate} onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })} type="datetime-local" className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            <ServiceAddressInput
              value={booking.address}
              onChange={({ address, coordinates }) => setBooking({ ...booking, address, coordinates })}
            />
            <textarea value={booking.additionalNotes} onChange={(e) => setBooking({ ...booking, additionalNotes: e.target.value })} placeholder={t('search.notes')} className="w-full h-28 bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setSelectedWorker(null)} className="border border-slate-200 py-3 rounded-2xl font-bold">{t('common.cancel')}</button>
              <button className="bg-primary-600 text-white py-3 rounded-2xl font-bold">{t('common.sendRequest')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
