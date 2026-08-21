import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const projectRoot = path.resolve(root, '..');

const failures = [];
const readFrontend = (relativePath) => fs.readFileSync(path.resolve(root, relativePath), 'utf8');
const readProject = (relativePath) => fs.readFileSync(path.resolve(projectRoot, relativePath), 'utf8');

const app = readFrontend('src/App.jsx');
[
  'path="/"',
  'path="/login"',
  'path="/signup"',
  'path="/search"',
  'path="/workers/:workerId"',
  'path="/dashboard/*"',
  'path="/worker/dashboard/*"',
  'path="/admin/dashboard/*"',
  'path="/messages"',
  'path="/profile"'
].forEach((route) => {
  if (!app.includes(route)) failures.push(`Missing smoke route: ${route}`);
});

const api = readFrontend('src/services/api.js');
[
  'uploadUserKYC',
  'uploadKYC',
  'getPendingWorkers',
  'approveWorker',
  'deleteAdminUser',
  'deleteAdminWorker',
  'getBookings',
  'verifyStartOTP',
  'verifyCompletionOTP'
].forEach((apiName) => {
  if (!api.includes(apiName)) failures.push(`Missing client API export: ${apiName}`);
});

const bookingController = readProject('backend/controllers/bookingController.js');
const bookingView = readProject('backend/utils/bookingView.js');
[
  'BOOKING_OTP_TTL_MS',
  'MAX_BOOKING_OTP_ATTEMPTS',
  'startOTPExpiresAt',
  'completionOTPExpiresAt',
  'tooManyBookingOtpAttempts',
  'bookingOtpExpired'
].forEach((token) => {
  if (!bookingController.includes(token) && !bookingView.includes(token)) {
    failures.push(`Booking OTP safeguard missing: ${token}`);
  }
});

const adminController = readProject('backend/controllers/adminController.js');
const adminAccounts = readProject('backend/utils/adminAccounts.js');
if (!adminController.includes('softDeleteAccountData') || !adminAccounts.includes('isDeleted: true')) {
  failures.push('Admin delete flow must soft-delete accounts');
}

const userUpload = readProject('backend/controllers/userController.js');
const workerUpload = readProject('backend/controllers/workerController.js');
if (!userUpload.includes('getUploadedFilePayload') || !workerUpload.includes('getUploadedFilePayload')) {
  failures.push('KYC upload controllers must normalize uploaded file URLs');
}

const sitemap = readFrontend('public/sitemap.xml');
if (sitemap.includes('/workers/</loc>')) {
  failures.push('Static sitemap must not include the invalid /workers/ listing route');
}

const backendApp = readProject('backend/app.js');
if (!backendApp.includes("app.get('/sitemap.xml'")) {
  failures.push('Backend must generate sitemap.xml dynamically');
}

if (failures.length) {
  console.error(failures.map((failure) => `fail - ${failure}`).join('\n'));
  process.exit(1);
}

console.log('ok - smoke routes, APIs, KYC documents, OTP, and admin delete flows passed');
