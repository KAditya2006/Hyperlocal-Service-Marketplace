const { normalizeServiceSearch } = require('./serviceKeywords');
const SERVICE_AVAILABILITY = require('../../shared/serviceAvailability.json');

const SUPPORTED_SERVICES = Object.entries(SERVICE_AVAILABILITY)
  .filter(([, active]) => active)
  .map(([service]) => service);

const ALL_KNOWN_SERVICES = Object.keys(SERVICE_AVAILABILITY);

const normalizeService = (service) => String(service || '').trim().toLowerCase();

const normalizeSupportedService = (service) => {
  const normalized = normalizeService(normalizeServiceSearch(service));
  return SUPPORTED_SERVICES.includes(normalized) ? normalized : '';
};

const isSupportedService = (service) => {
  if (!String(service || '').trim()) return true;
  return Boolean(normalizeSupportedService(service));
};

const isKnownService = (service) => {
  const normalized = normalizeService(normalizeServiceSearch(service));
  return ALL_KNOWN_SERVICES.includes(normalized);
};

module.exports = {
  SUPPORTED_SERVICES,
  ALL_KNOWN_SERVICES,
  isSupportedService,
  isKnownService,
  normalizeSupportedService
};
