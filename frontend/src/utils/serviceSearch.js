import { PROFESSIONS, SERVICE_ALIASES } from '../constants/professions';

const SERVICE_LABELS = {
  'ac repair/service': 'AC Repair / Service',
  'appliances repair/service': 'Appliance Repair / Service',
  carpenters: 'Carpenter',
  'door/lock repair': 'Door / Lock Repair',
  'home tutors': 'Home Tutor',
  'house cleaner': 'House Cleaner',
  'internet technician': 'Internet Technician',
  'laptop/mobile repair': 'Laptop / Mobile Repair',
  'laptop/mobile reapir': 'Laptop / Mobile Repair',
  pharmacist: 'Pharmacist',
  pharamascist: 'Pharmacist'
};

export const formatServiceLabel = (service) => {
  if (SERVICE_LABELS[service]) return SERVICE_LABELS[service];
  return service.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const normalizeService = (service) => service.trim().toLowerCase();

export const normalizeServiceAlias = (service) => {
  return SERVICE_ALIASES[normalizeService(service)] || normalizeService(service);
};

export const isListedService = (service) => {
  if (!service.trim()) return true;
  const normalized = normalizeServiceAlias(service);
  return PROFESSIONS.some((profession) => normalizeService(profession) === normalized);
};

export const getSuggestedServices = (service) => {
  const normalized = normalizeServiceAlias(service);
  const matches = PROFESSIONS.filter((profession) => {
    const normalizedProfession = normalizeService(profession);
    return normalized && (
      normalizedProfession.includes(normalized) ||
      normalized.includes(normalizedProfession.split(' ')[0])
    );
  });

  const fallback = [
    'plumber',
    'electrician',
    'house cleaner',
    'home tutors',
    'ac repair/service',
    'appliances repair/service'
  ];

  return [...new Set([...(matches.length ? matches : fallback), ...fallback])].slice(0, 8);
};

export const getSearchOrigin = (user) => {
  const coordinates = user?.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;

  return { lat, lng };
};

export const getWorkerSkills = (worker) => {
  return worker?.skills?.length ? worker.skills : worker?.professions || [];
};

export const formatDistance = (distanceKm, t) => {
  const distance = Number(distanceKm);
  if (!Number.isFinite(distance)) return null;
  if (distance < 1) {
    return t('search.distanceMeters', { distance: Math.max(Math.round(distance * 1000), 1) });
  }
  return t('search.distanceKm', { distance: distance.toFixed(distance < 10 ? 1 : 0) });
};
