const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const normalizeOrigin = (origin) => {
  const value = String(origin || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
};

const parseOriginList = (value) => String(value || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const isDevelopment = () => process.env.NODE_ENV !== 'production';

const isLocalDevOrigin = (origin) => {
  if (!isDevelopment()) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin);
};

const getAllowedOrigins = () => {
  const configuredOrigins = parseOriginList(process.env.CLIENT_ORIGIN);
  const renderOrigin = normalizeOrigin(process.env.RENDER_EXTERNAL_URL);
  const developmentOrigins = isDevelopment() ? DEFAULT_DEV_ORIGINS : [];

  return [...new Set([
    ...configuredOrigins,
    renderOrigin,
    ...developmentOrigins.map(normalizeOrigin)
  ].filter(Boolean))];
};

const isAllowedOrigin = (origin, allowedOrigins = getAllowedOrigins()) => {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.includes(normalizedOrigin) || isLocalDevOrigin(normalizedOrigin);
};

module.exports = {
  getAllowedOrigins,
  isAllowedOrigin,
  normalizeOrigin
};
