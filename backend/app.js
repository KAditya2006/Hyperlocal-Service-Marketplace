const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const WorkerProfile = require('./models/WorkerProfile');
const { getMissingEnv, OPTIONAL_SERVICE_GROUPS, REQUIRED_IN_PRODUCTION } = require('./config/validateEnv');
const { getAllowedOrigins, isAllowedOrigin, normalizeOrigin } = require('./utils/allowedOrigins');
const languageMiddleware = require('./middleware/languageMiddleware');
const logger = require('./utils/logger');
const sendEmail = require('./utils/sendEmail');

const app = express();
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const hasFrontendBuild = fs.existsSync(path.join(frontendDistPath, 'index.html'));

/**
 * 1. SECURITY & CONFIGURATION
 */
const isProduction = process.env.NODE_ENV === 'production';
const contentSecurityPolicy = isProduction ? {
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: ["'self'", 'https:', 'wss:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https:']
  }
} : false;

app.use(helmet({ contentSecurityPolicy }));

const allowedOrigins = getAllowedOrigins();

const getBaseUrl = (req) => {
  return normalizeOrigin(
    process.env.PUBLIC_APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `${req.protocol}://${req.get('host')}`
  );
};

const escapeXml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const formatLastMod = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const maskEmailForHealth = (email = '') => {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return null;
  return `${name.slice(0, 2)}***@${domain}`;
};

const getSmtpHealth = () => {
  const sender = sendEmail.getSmtpSender();
  const smtpUser = process.env.SMTP_USER;

  return {
    configured: sendEmail.getMissingSmtpConfig().length === 0,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    user: maskEmailForHealth(smtpUser),
    from: maskEmailForHealth(sender),
    fromMatchesUser: Boolean(sender && smtpUser && sender === smtpUser)
  };
};

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin, allowedOrigins)) {
      return callback(null, true);
    }
    const error = new Error('Not allowed by CORS');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(languageMiddleware);

/**
 * 2. API HEALTH
 */
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const missingOptional = Object.fromEntries(
    Object.entries(OPTIONAL_SERVICE_GROUPS).map(([group, keys]) => [group, getMissingEnv(keys)])
  );

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    service: 'InstantSeva API',
    uptime: Math.round(process.uptime()),
    database: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
    frontendBuild: hasFrontendBuild,
    environment: {
      missingRequired: getMissingEnv(REQUIRED_IN_PRODUCTION),
      missingOptional,
      smtp: getSmtpHealth()
    }
  });
});

/**
 * 3. API ROUTES
 */
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: req.t('apiRouteNotFound')
  });
});

/**
 * 4. STATIC FILES & SPA ROUTING (LOWEST PRIORITY)
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (hasFrontendBuild) {
  const seoStaticFiles = {
    '/robots.txt': { fileName: 'robots.txt', contentType: 'text/plain; charset=utf-8' },
    '/site.webmanifest': { fileName: 'site.webmanifest', contentType: 'application/manifest+json; charset=utf-8' }
  };

  app.get('/sitemap.xml', async (req, res, next) => {
    try {
      const baseUrl = getBaseUrl(req);
      const staticRoutes = [
        { path: '/', changefreq: 'daily', priority: '1.0' },
        { path: '/search', changefreq: 'daily', priority: '0.9' },
        { path: '/login', changefreq: 'monthly', priority: '0.5' },
        { path: '/signup', changefreq: 'monthly', priority: '0.5' },
        { path: '/forgot-password', changefreq: 'monthly', priority: '0.3' },
        { path: '/verify-otp', changefreq: 'monthly', priority: '0.3' }
      ];

      const approvedWorkers = await WorkerProfile.find({ approvalStatus: 'approved' })
        .select('user updatedAt')
        .populate('user', '_id isDeleted updatedAt')
        .sort({ updatedAt: -1 })
        .limit(1000)
        .lean();

      const workerRoutes = approvedWorkers
        .filter((worker) => worker.user && !worker.user.isDeleted)
        .map((worker) => ({
          path: `/workers/${worker.user._id}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: worker.updatedAt || worker.user.updatedAt
        }));

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticRoutes, ...workerRoutes].map((route) => `  <url>
    <loc>${escapeXml(`${baseUrl}${route.path}`)}</loc>
    <lastmod>${formatLastMod(route.lastmod)}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(xml);
    } catch (error) {
      return next(error);
    }
  });

  Object.entries(seoStaticFiles).forEach(([route, fileConfig]) => {
    app.get(route, (req, res, next) => {
      const filePath = path.join(frontendDistPath, fileConfig.fileName);

      if (!fs.existsSync(filePath)) {
        return next();
      }

      res.setHeader('Content-Type', fileConfig.contentType);
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.sendFile(filePath);
    });
  });

  // Serve static assets from the frontend build
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve index.html for React SPA
  app.get(/^(?!\/api|\/sitemap\.xml|\/robots\.txt|\/site\.webmanifest).+/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.status(isProduction ? 503 : 200).json({
      success: !isProduction,
      message: 'Frontend build not found on this server',
      service: 'InstantSeva API',
      frontendBuild: false
    });
  });
}

/**
 * 5. ERROR HANDLING
 */
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error('API Error', { message: err.message, path: req.originalUrl });
  }
  const status = err.statusCode || 500;
  const isServerError = status >= 500;
  const message = isServerError && process.env.NODE_ENV === 'production'
    ? 'Something went wrong on our end'
    : err.message || 'Something went wrong on our end';

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

module.exports = app;
