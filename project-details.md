# InstantSeva Complete Project Details and Audit

Audit date: 2026-07-14  
Workspace: `C:\Users\LENOVO\Desktop\Antigravity\Startup`  
Status: partially completed audit based on source inspection, dependency manifests, frontend build, frontend lint, backend tests, and local backend health check. Browser role-by-role testing, uploads, email, push delivery, and production URL checks were not fully completed in this pass.

## Executive Summary

InstantSeva is a full-stack hyperlocal service marketplace that connects customers with nearby verified service workers. It includes customer booking, worker onboarding/KYC, admin approval, real-time chat, reviews, notifications, multilingual UI, location-aware discovery, and Render deployment support.

Verified working checks:

- `npm test --prefix backend`: passed.
- `npm run build --prefix frontend`: passed.
- `npm run lint --prefix frontend`: passed.
- `GET http://localhost:5000/api/health`: returned 200 with MongoDB connected and frontend build present.

Important limitations:

- Payment is manual/prototype status tracking, not real payment-gateway integration.
- `NOMINATIM_USER_AGENT` is missing from current health output, so geocoder production configuration is incomplete.
- JWT is stored in browser `localStorage`.
- Full browser responsiveness, role flows, file upload, SMTP delivery, push delivery, and live production behavior were not fully verified.

## 1. Project Overview

| Item | Detail |
| --- | --- |
| Project name | InstantSeva |
| Purpose | Hyperlocal marketplace for finding and booking local service workers |
| Business problem | Customers need trusted nearby workers; workers need discoverability and job requests |
| Target users | Customers, workers/service providers, admins, guests |
| Structure | Monorepo-style root with `backend`, `frontend`, `shared` |
| Frontend | React/Vite app |
| Backend | Express API and Socket.IO server |
| Database | MongoDB via Mongoose |
| Package manager | npm |
| Deployment | Render blueprint in `render.yaml` |
| Local backend | `http://localhost:5000` |
| Local frontend | `http://localhost:5173` |
| Live URL | Not found/provided |

Repository contains frontend, backend, admin panel, customer panel, worker panel, shared keyword data, tests, seed script, documentation, and Render config. Migration files, Docker files, Postman collection, and GitHub CI workflow were not found.

## 2. Repository Structure

```text
Startup/
  backend/     app, server, config, controllers, middleware, models, routes, scripts, services, tests, utils
  frontend/    Vite app with public assets, scripts, src pages/components/context/i18n/services/utils
  shared/      serviceKeywords.json
```

Entry points: `backend/index.js`, `backend/app.js`, `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/services/api.js`, `backend/config/db.js`, `backend/middleware/authMiddleware.js`.

## 3. Technology Stack

Frontend: React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4, i18next/react-i18next, Socket.IO client, Leaflet/react-leaflet, Framer Motion, Lucide React, React Hot Toast.

Backend: Node.js, Express 5, MongoDB/Mongoose, Socket.IO, JWT, bcryptjs, multer, Cloudinary, Nodemailer, web-push, Helmet, CORS, express-rate-limit, Morgan.

Shared: `shared/serviceKeywords.json` for service keyword matching.

Evidence: `README.md`, `PROJECT_OVERVIEW.md`, root `package.json`, `backend/package.json`, `frontend/package.json`, `render.yaml`.

## 4. Setup Instructions

Install:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Run:

```bash
npm run dev
npm run dev --prefix backend
npm run dev --prefix frontend
```

Build/test/seed:

```bash
npm run build
npm test --prefix backend
npm run lint --prefix frontend
npm run seed --prefix backend
```

Deploy/start:

```bash
npm start
```

## 5. Environment Variables

Variables listed by templates/config: `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_NAME`, `FROM_EMAIL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_MAPS_API_KEY`, `NOMINATIM_USER_AGENT`, `GEOCODER_COUNTRY_CODES`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL`, frontend `VITE_API_URL`.

Current health check: no missing required variables; optional `geocoder.NOMINATIM_USER_AGENT` missing; SMTP, Cloudinary, and push present according to `/api/health`. Sensitive values were not exposed.

## 6. Architecture

Request lifecycle:

```text
Frontend component -> Axios client -> Express route -> middleware -> controller -> service/utility/model -> MongoDB -> JSON response
```

Real-time lifecycle:

```text
Socket.IO client -> JWT socket auth -> user/chat/booking rooms -> chat/presence/location event -> MongoDB where applicable -> Socket.IO emit
```

Architecture type: monolithic full-stack app with route/controller/model structure and service/utility helpers. Dynamic worker collections are supported by `backend/models/WorkerModels.js`.

## 7. User Roles

Verified roles from `backend/models/User.js`: `user`, `worker`, `admin`.

Guest routes: `/`, `/search`, `/workers/:workerId`, `/login`, `/signup`, `/verify-otp`, `/forgot-password`.

Protected routes: customer `/dashboard/*`, worker `/worker/dashboard/*`, admin `/admin/dashboard/*`, authenticated `/profile`, `/profile/edit`, approved chat `/messages`.

## 8. Role-Permission Matrix

| Module/Action | Customer | Worker | Admin | Guest |
| --- | ---: | ---: | ---: | ---: |
| Browse home/search | Yes | Yes | Yes | Yes |
| View worker profile | Yes | Yes | Yes | Yes |
| Register/login | Yes | Yes | Admin account exists/created | Yes |
| Complete profile/KYC | Yes | Yes | No | No |
| Access dashboard before approval | No | No | Yes | No |
| Create booking | Yes | No | No | No |
| View bookings | Own | Assigned | All | No |
| Accept/reject booking | No | Assigned worker | Yes | No |
| Cancel booking | Own booking | No | Yes | No |
| Start OTP verification | Yes | No | No | No |
| Completion OTP verification | No | Yes | No | No |
| Manual payment update | Own booking | No | Yes | No |
| Review completed booking | Yes | No | No | No |
| Chat | Restricted | Restricted | Support/admin access | No |
| Manage users/workers | No | No | Yes | No |
| Approve/reject KYC | No | No | Yes | No |
| View audit logs | No | No | Yes | No |

Evidence: `backend/routes/*`, `backend/controllers/bookingController.js`, `backend/controllers/adminController.js`, `backend/utils/chatAccess.js`.

## 9. Customer Flow

Verified source-code flow:

```text
Home -> Signup as user -> Email OTP verification -> Login -> Profile/KYC submission -> Admin approval -> Dashboard access -> Search workers by service/location -> Worker profile -> Chat or create booking -> Booking pending -> Worker accepts/rejects -> Customer verifies start OTP -> Booking in progress -> Worker verifies completion OTP -> Booking completed -> Customer reviews worker
```

Customer APIs: `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/login`, `PUT /api/user/profile`, `POST /api/user/upload-kyc`, `GET /api/marketplace/workers`, `GET /api/marketplace/workers/:workerId`, `POST /api/bookings`, `GET /api/bookings`, `PATCH /api/bookings/:id/payment`, `POST /api/bookings/:id/verify-start-otp`, `POST /api/bookings/:id/review`.

Status: source verified and backend rules tested; full browser customer journey not completed.

## 10. Worker Flow

Verified source-code flow:

```text
Signup as worker -> Email OTP verification -> Worker profile created -> KYC/profile completion -> Admin approval -> Worker dashboard access -> Update availability/profile -> Receive booking -> Accept/reject booking -> Chat with customer -> Start OTP sent after acceptance -> Customer starts job with OTP -> Worker verifies completion OTP -> Job completed -> Worker availability returns to Available
```

Worker APIs: `GET /api/worker/profile`, `PATCH /api/worker/profile`, `POST /api/worker/upload-kyc`, `GET /api/bookings`, `PATCH /api/bookings/:id/status`, `POST /api/bookings/:id/verify-completion-otp`, `POST /api/chat/initiate`.

Status: source verified; full browser worker journey not completed.

## 11. Admin Flow

Verified source-code flow:

```text
Admin login -> Admin dashboard -> View stats -> Search users/workers/bookings -> Add user or worker -> Review pending KYC -> Approve/reject identity -> Soft-delete users/workers if no active bookings -> View bookings -> View audit logs
```

Admin APIs: `GET /api/admin/stats`, `GET /api/admin/audit-logs`, `GET /api/admin/users`, `POST /api/admin/users`, `DELETE /api/admin/users/:userId`, `GET /api/admin/workers`, `POST /api/admin/workers`, `DELETE /api/admin/workers/:workerId`, `GET /api/admin/bookings`, `GET /api/admin/pending-workers`, `POST /api/admin/approve-worker`.

Evidence: `backend/routes/adminRoutes.js`, `backend/controllers/adminController.js`, `frontend/src/pages/AdminDashboard.jsx`.

## 12. Frontend Audit

Pages found: `Home.jsx`, `Search.jsx`, `WorkerProfile.jsx`, `Signup.jsx`, `Login.jsx`, `VerifyOTP.jsx`, `ForgotPassword.jsx`, `Dashboard.jsx`, `WorkerDashboard.jsx`, `AdminDashboard.jsx`, `Chat.jsx`, `Profile.jsx`, `EditProfile.jsx`, `NotFound.jsx`.

Frontend implementation:

- Lazy loaded route pages.
- Protected route gates by role and dashboard access.
- Axios API client with bearer token and language headers.
- Auth persisted in `localStorage`.
- Customer booking actions in `Dashboard.jsx`, `Search.jsx`, `WorkerProfile.jsx`.
- Worker booking/profile/KYC actions in `WorkerDashboard.jsx`.
- Admin management in `AdminDashboard.jsx` and admin components.
- Multilingual locale files for 22 scheduled Indian languages.
- Leaflet map/tracking components.
- Voice search and push notification utilities.

Checks: frontend lint passed; frontend production build passed.

Risks/not verified: responsive breakpoints 320, 375, 768, 1024, 1366, 1440 were not screenshot-tested; no browser console/network audit was completed; JWT in `localStorage` is a production security risk.

## 13. Backend Audit

Route groups: `/api/auth`, `/api/user`, `/api/worker`, `/api/marketplace`, `/api/bookings`, `/api/chat`, `/api/admin`, `/api/notifications`, `/api/health`.

Implemented backend capabilities:

- JWT auth, role authorization, verified-only and dashboard-approved gates.
- Registration, OTP verification, login, password reset.
- Customer and worker profile/KYC uploads.
- Worker search and public worker detail.
- Booking lifecycle with OTP start/completion.
- Manual payment status update.
- Review/rating aggregation.
- Restricted chat with text/image messages, delivery/read receipts.
- Socket.IO presence and worker live location events.
- Admin stats, users, workers, bookings, approvals, audit logs.
- In-app notifications and browser push subscription support.
- Helmet, CORS, rate limiting, language middleware, error handler.

Backend tests passed.

## 14. Complete API Documentation

Total API endpoints found: 46.

| Method | Endpoint | Auth | Roles | Purpose | Status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | No | Public | Health/env/database/frontend status | Runtime working |
| POST | `/api/auth/register` | No | Public | Register user/worker | Source verified |
| POST | `/api/auth/verify-otp` | No | Public | Verify email OTP and issue token | Source verified |
| POST | `/api/auth/login` | No | Public | Login | Source verified |
| POST | `/api/auth/resend-otp` | No | Public | Resend OTP | Source verified |
| POST | `/api/auth/forgot-password` | No | Public | Send reset code | Source verified |
| POST | `/api/auth/reset-password` | No | Public | Reset password | Source verified |
| GET | `/api/auth/me` | Yes | All roles | Current user | Source verified |
| PUT | `/api/user/profile` | Yes | All roles | Update profile/language/location | Source verified |
| PUT | `/api/user/profile/avatar` | Yes | All roles | Upload avatar | Source verified |
| POST | `/api/user/upload-kyc` | Yes | User/all auth | Upload user KYC | Source verified |
| GET | `/api/worker/profile` | Yes | Worker | Get worker profile | Source verified |
| PATCH | `/api/worker/profile` | Yes | Verified worker | Update worker profile | Source verified |
| POST | `/api/worker/upload-kyc` | Yes | Worker | Upload worker KYC | Source verified |
| GET | `/api/marketplace/locations/search` | No | Public | Location search via Nominatim | Partial config |
| GET | `/api/marketplace/workers` | No | Public | Search/list workers | Source verified |
| GET | `/api/marketplace/workers/:workerId` | No | Public | Worker details/reviews | Source verified |
| GET | `/api/bookings` | Yes | Approved roles | List bookings by role | Source verified |
| POST | `/api/bookings` | Yes | Approved customer | Create booking | Source verified |
| PATCH | `/api/bookings/:id/status` | Yes | Customer/worker/admin | Update booking status | Source verified |
| PATCH | `/api/bookings/:id/payment` | Yes | Customer/admin | Manual payment status | Partial |
| POST | `/api/bookings/:id/verify-start-otp` | Yes | Customer | Start job OTP | Source verified |
| POST | `/api/bookings/:id/verify-completion-otp` | Yes | Worker | Complete job OTP | Source verified |
| POST | `/api/bookings/:id/review` | Yes | Customer | Create review | Source verified |
| GET | `/api/chat` | Yes | Approved roles | List chats | Source verified |
| GET | `/api/chat/:chatId` | Yes | Participant | Get messages | Source verified |
| POST | `/api/chat/initiate` | Yes | Approved roles/admin | Start/find chat | Source verified |
| POST | `/api/chat/:chatId/messages` | Yes | Participant | Send text message | Source verified |
| PATCH | `/api/chat/:chatId/read` | Yes | Participant | Mark read | Source verified |
| POST | `/api/chat/upload-image` | Yes | Participant | Send image message | Source verified |
| GET | `/api/admin/stats` | Yes | Admin | Dashboard stats | Source verified |
| GET | `/api/admin/audit-logs` | Yes | Admin | Audit logs | Source verified |
| GET | `/api/admin/users` | Yes | Admin | List/search users | Source verified |
| POST | `/api/admin/users` | Yes | Admin | Create user | Source verified |
| DELETE | `/api/admin/users/:userId` | Yes | Admin | Soft-delete user | Source verified |
| GET | `/api/admin/workers` | Yes | Admin | List/search workers | Source verified |
| POST | `/api/admin/workers` | Yes | Admin | Create worker | Source verified |
| DELETE | `/api/admin/workers/:workerId` | Yes | Admin | Soft-delete worker | Source verified |
| GET | `/api/admin/bookings` | Yes | Admin | List/search bookings | Source verified |
| GET | `/api/admin/pending-workers` | Yes | Admin | Pending KYC queue | Source verified |
| POST | `/api/admin/approve-worker` | Yes | Admin | Approve/reject user or worker | Source verified |
| GET | `/api/notifications` | Yes | All roles | List notifications | Source verified |
| PATCH | `/api/notifications/read` | Yes | All roles | Mark read | Source verified |
| GET | `/api/notifications/push/public-key` | Yes | All roles | Push public key/config | Source verified |
| POST | `/api/notifications/push/subscribe` | Yes | All roles | Save push subscription | Source verified |
| DELETE | `/api/notifications/push/unsubscribe` | Yes | All roles | Remove push subscription | Source verified |

Example protected headers:

```http
Authorization: Bearer <masked-token>
Accept-Language: en
X-Language: en
```

## 15. Database Documentation

Database model files found: 13.

| Model | Purpose | Important fields |
| --- | --- | --- |
| `User` | Account/profile | name, email, password, role, isVerified, isAdminApproved, kyc, phone, avatar, preferredLanguage, location, isDeleted |
| `WorkerProfile` | Searchable worker profile | user, skills, experience, bio, pricing, availabilityStatus, averageRating, totalReviews, approvalStatus, kyc |
| `Booking` | Service job lifecycle | user, worker, service, scheduledDate, status, OTP fields, address, serviceLocation, totalPrice, paymentStatus |
| `Review` | One review per booking | booking, user, worker, rating, comment |
| `Chat` | Chat metadata | participants, lastMessage |
| `Message` | Chat messages | chatId, sender, content, messageType, imageUrl, deliveredTo, readBy |
| `Notification` | In-app notifications | user, type, title, message, language, entityType, entityId, read |
| `PushSubscription` | Browser push | user, endpoint, expirationTime, keys, userAgent |
| `OTP` | Email verification | email, otp, attempts, lastAttemptAt, TTL 10 min |
| `PasswordReset` | Reset code hash | email, tokenHash, attempts, TTL 15 min |
| `AuditLog` | Important actions | actor, action, entityType, entityId, details |
| `CommonLocation` | Reusable public places | name, area, city, pincode, location, usageCount, isGlobal |
| `WorkerModels` | Dynamic profession collections | user, professions, experience, bio, pricing, availability, approvalStatus |

Relationships:

```text
User
├── has one -> WorkerProfile
├── creates -> Booking as customer
├── receives -> Booking as worker
├── writes -> Review
├── participates in -> Chat
├── sends -> Message
├── receives -> Notification
└── owns -> PushSubscription

Booking
├── references customer -> User
├── references worker -> User
├── may have one -> Review
└── creates -> Notification/AuditLog entries
```

Evidence: `backend/models/*.js`.

## 16. Authentication and Authorization

Implemented:

- Registration for `user` and `worker`.
- Worker registration creates a dynamic worker model record plus `WorkerProfile`.
- Email OTP verification; OTP expires after 10 minutes.
- OTP attempts limited to 5.
- Login requires verified email.
- JWT tokens signed with `JWT_SECRET`, default expiry 30 days.
- Passwords hashed with bcrypt before save.
- Password reset uses hashed token/code and timing-safe comparison.
- `protect`, `authorize`, `verifiedOnly`, and `dashboardApprovedOnly` middleware.
- Deleted users are rejected by auth middleware.

Risks: JWT stored in `localStorage`; no refresh token rotation or logout invalidation found.

Evidence: `backend/controllers/authController.js`, `backend/middleware/authMiddleware.js`, `frontend/src/context/AuthContext.jsx`, `backend/models/User.js`.

## 17. Booking Workflow

Statuses: `pending`, `accepted`, `in_progress`, `completed`, `cancelled`, `rejected`.

Valid transitions:

```text
pending -> accepted
pending -> rejected
pending -> cancelled
accepted -> in_progress
accepted -> cancelled
in_progress -> completed
in_progress -> cancelled
```

Rules:

- Only customer role can create bookings.
- Worker must be approved and available/not offline.
- Customer can cancel own booking.
- Assigned worker or admin can accept/reject/complete where valid.
- Start OTP moves accepted booking to in-progress.
- Completion OTP moves in-progress booking to completed.
- Worker availability changes to Busy after acceptance/start and Available after completion/cancellation/rejection.

Evidence: `backend/models/Booking.js`, `backend/utils/bookingRules.js`, `backend/controllers/bookingController.js`.

## 18. Payment Workflow

Payment status values: `pending`, `paid`, `failed`, `refunded`.

Current behavior:

- Customer or admin can update payment status manually.
- `paid` is allowed only for accepted or completed bookings.
- `refunded` is allowed only after prior paid status.
- Cancelled bookings can only move to refunded payment status.

Status: partially implemented/prototype. No Razorpay/Stripe order creation, signature verification, webhook, invoice, commission, or payout implementation was found.

Evidence: `backend/models/Booking.js`, `backend/controllers/bookingController.js`, `backend/utils/bookingRules.js`, `README.md`.

## 19. Location and Maps

Implemented:

- GeoJSON Point stored on users and bookings.
- Worker search accepts `lat` and `lng` and sorts by computed distance.
- Nominatim/OpenStreetMap location search proxy exists.
- Location search cache exists in memory.
- Leaflet/react-leaflet frontend components exist.
- Socket.IO live worker location updates exist for accepted/in-progress bookings.

Partial/not verified: health output says `NOMINATIM_USER_AGENT` is missing; browser geolocation permission, map rendering, and live tracking were not manually verified.

Evidence: `backend/controllers/locationController.js`, `backend/controllers/marketplaceController.js`, `backend/index.js`, `frontend/src/components/TrackingMap.jsx`.

## 20. Notifications and Communication

Implemented:

- In-app notifications in MongoDB.
- Notification read status.
- Browser push subscription storage.
- Web Push service using VAPID keys.
- Booking, chat, payment, review, and system notification types.
- Socket.IO chat, presence, delivery/read receipts.

Not found or not verified: SMS integration not found; WhatsApp integration not found; SMTP delivery not runtime-tested; browser push delivery not runtime-tested.

Evidence: `backend/controllers/notificationController.js`, `backend/services/pushNotificationService.js`, `backend/utils/createNotification.js`, `backend/controllers/chatController.js`.

## 21. File and Image Uploads

Upload areas: user KYC, worker KYC, avatar/profile image, chat image message.

Storage and validation:

- Cloudinary storage through `multer-storage-cloudinary`.
- KYC formats: JPG, PNG, JPEG, PDF.
- Chat/avatar formats: JPG, PNG, JPEG, WebP.
- KYC/chat max size: 5 MB.
- Avatar max size: 2 MB.

Not verified: actual Cloudinary upload with test files; delete behavior for uploaded Cloudinary assets.

Evidence: `backend/config/cloudinary.js`, `backend/routes/userRoutes.js`, `backend/routes/workerRoutes.js`, `backend/routes/chatRoutes.js`.

## 22. Testing and Quality Audit

| Command | Result |
| --- | --- |
| `npm test --prefix backend` | Passed |
| `npm run build --prefix frontend` | Passed |
| `npm run lint --prefix frontend` | Passed |
| `GET http://localhost:5000/api/health` | 200 OK |

Backend test output covered booking transitions, booking price, pagination, payment status rules, regex escaping, chat access rules, booking OTP fields, upload payload normalization, production env validation, server translations, and presence helpers.

Not run separately in this pass: root `npm test` full chain, frontend i18n smoke scripts, browser E2E role flows, visual/responsive screenshots.

## 23. Security Audit

Implemented controls: bcrypt password hashing, JWT bearer auth, role authorization, email verification, dashboard approval gate, OTP attempt limits, password reset token hashing, Helmet, CORS origin allowlist, rate limiters, soft delete/suspend behavior, upload MIME/size checks, audit logs.

| Severity | Issue | Evidence | Recommendation |
| --- | --- | --- | --- |
| High | JWT stored in `localStorage` | `frontend/src/context/AuthContext.jsx` | Use HTTP-only cookies or short-lived access tokens with refresh rotation |
| High | Payment can be manually marked without gateway proof | `bookingController.js` | Add real gateway verification/webhooks |
| Medium | `NOMINATIM_USER_AGENT` missing | `/api/health` | Configure proper geocoder contact user agent |
| Medium | Full IDOR/cross-role API testing not completed | Not runtime tested | Add automated authorization tests |
| Medium | Upload, email, and push not runtime-tested | Upload/notification code | Add integration tests/manual QA |
| Low | Distance sort can be inefficient at scale | `marketplaceController.js` | Use Mongo geospatial querying/indexes |

## 24. Performance and Scalability

Strengths: pagination clamps page/limit and max limit to 50; indexes exist on users, bookings, worker profiles, messages, and locations; frontend uses lazy-loaded route chunks; location search has in-memory cache.

Risks: coordinate search loads matched workers before distance sort/slice; regex search can degrade on large data; no queue system for email/push jobs found; no APM/monitoring found; Socket.IO scaling beyond one instance is not configured.

Scale estimate: 100 users likely fine; 1,000 users likely fine with decent MongoDB hosting; 10,000 users needs geospatial query improvements, queues, caching, monitoring, and Socket.IO scaling; multi-city/high-volume use needs stronger search, analytics, provider ranking, and operational tooling.

## 25. Deployment Audit

Render config:

```yaml
services:
  - type: web
    name: instantseva
    env: node
    plan: free
    buildCommand: npm ci && npm run ci
    startCommand: npm start
    healthCheckPath: /api/health
```

Backend serves frontend build from `frontend/dist` when present and provides SPA fallback. SEO static files and dynamic sitemap are handled in `backend/app.js`.

Not verified: live Render URL, HTTPS/domain behavior, production CORS against a real deployed frontend, cold-start performance.

## 26. Feature Inventory

Total features found: 38.

| ID | Module | Feature | Role | Frontend | Backend | Database | Runtime Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | Public | Home page | Guest | Yes | N/A | N/A | Build verified | Browser not manually tested |
| F02 | Public | Search workers | Guest/user | Yes | Yes | WorkerProfile/User | Source verified | Service/rating/price/location |
| F03 | Public | Worker profile | Guest/user | Yes | Yes | WorkerProfile/Review | Source verified | Public approved workers |
| F04 | Auth | Registration | Guest | Yes | Yes | User/WorkerProfile/OTP | Source verified | User or worker |
| F05 | Auth | Email OTP | Guest | Yes | Yes | OTP/User | Source verified | TTL and attempts |
| F06 | Auth | Login | Guest | Yes | Yes | User | Source verified | Requires verified email |
| F07 | Auth | Forgot/reset password | Guest | Yes | Yes | PasswordReset/User | Source verified | Has attempt limits |
| F08 | Auth | Current user | All auth | Yes | Yes | User | Source verified | `/auth/me` |
| F09 | Profile | Customer profile | User | Yes | Yes | User | Source verified | Language/location |
| F10 | Profile | Avatar upload | Auth | Yes | Yes | User/Cloudinary | Source verified | Upload not runtime-tested |
| F11 | KYC | Customer KYC | User | Yes | Yes | User/Cloudinary | Source verified | Upload not runtime-tested |
| F12 | Worker | Worker profile | Worker | Yes | Yes | WorkerProfile | Source verified | Verified worker only |
| F13 | Worker | Worker KYC | Worker | Yes | Yes | WorkerProfile/Cloudinary | Source verified | Upload not runtime-tested |
| F14 | Worker | Availability | Worker | Yes | Yes | WorkerProfile | Source verified | Syncs dynamic profile |
| F15 | Booking | Create booking | User | Yes | Yes | Booking | Source verified | Approved user only |
| F16 | Booking | List bookings | User/worker/admin | Yes | Yes | Booking | Source verified | Role-filtered |
| F17 | Booking | Accept booking | Worker/admin | Yes | Yes | Booking | Source verified | Sends start OTP |
| F18 | Booking | Reject booking | Worker/admin | Yes | Yes | Booking | Source verified | Frees worker |
| F19 | Booking | Cancel booking | User/admin | Yes | Yes | Booking | Source verified | Valid transitions |
| F20 | Booking | Start OTP | User | Yes | Yes | Booking | Source verified | Moves in progress |
| F21 | Booking | Completion OTP | Worker | Yes | Yes | Booking | Source verified | Completes booking |
| F22 | Payment | Manual payment | User/admin | Yes | Yes | Booking | Partial | No gateway |
| F23 | Review | Review worker | User | Yes | Yes | Review/WorkerProfile | Source verified | Completed only |
| F24 | Chat | Initiate chat | Auth | Yes | Yes | Chat | Source verified | Restricted |
| F25 | Chat | Text messages | Auth | Yes | Yes | Message | Source verified | Socket emit |
| F26 | Chat | Image messages | Auth | Yes | Yes | Message/Cloudinary | Source verified | Upload not runtime-tested |
| F27 | Chat | Read/delivery receipts | Auth | Yes | Yes | Message | Source verified | Socket updates |
| F28 | Presence | Online/offline | Auth | Yes | Yes | User | Test passed | |
| F29 | Location | Autocomplete | Public | Yes | Yes | N/A | Partial | Missing user agent |
| F30 | Location | Distance search | Public | Yes | Yes | User/WorkerProfile | Source verified | App-side sort |
| F31 | Location | Live tracking | User/worker | Yes | Yes | Booking | Source verified | Not runtime-tested |
| F32 | Admin | Stats | Admin | Yes | Yes | Multiple | Source verified | |
| F33 | Admin | User/worker management | Admin | Yes | Yes | User/WorkerProfile | Source verified | Soft delete |
| F34 | Admin | KYC approval | Admin | Yes | Yes | User/WorkerProfile | Source verified | Notifications |
| F35 | Admin | Booking directory | Admin | Yes | Yes | Booking | Source verified | Search/status |
| F36 | Admin | Audit logs | Admin | Yes | Yes | AuditLog | Source verified | Last 100 |
| F37 | Notifications | In-app notifications | Auth | Yes | Yes | Notification | Source verified | |
| F38 | Push | Browser push | Auth | Yes | Yes | PushSubscription | Partial | Browser delivery not tested |

## 27. Bug and Issue Report

| Bug ID | Module | Description | Expected | Actual | Severity | Evidence | Suggested Fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B01 | Payment | Payment is manual only | Gateway-verified payment | Status can be set manually | High | `bookingController.js` | Add Razorpay/Stripe with webhook/signature verification |
| B02 | Auth | JWT stored in localStorage | Hardened token storage | Token persisted in localStorage | High | `AuthContext.jsx` | Use HTTP-only cookies or refresh-token rotation |
| B03 | Location | Missing Nominatim user agent | Proper provider config | Health reports missing geocoder var | Medium | `/api/health` | Add `NOMINATIM_USER_AGENT` |
| B04 | Testing | Full browser responsive audit missing | Tested requested widths | Not verified | Medium | Frontend pages | Add Playwright screenshot checks |
| B05 | Uploads | Upload flows not runtime-tested | Verified Cloudinary uploads | Not verified | Medium | Upload routes | Add safe file upload tests |
| B06 | Search | Distance sort may not scale | Efficient geospatial query | Fetch/sort/slice in app | Low | `marketplaceController.js` | Use Mongo geospatial queries |
| B07 | Push | Push delivery not verified | Browser push delivered | Not tested | Low | `pushNotificationService.js` | Add browser/manual push test |

No critical issue was confirmed in this pass. No feature was conclusively verified as broken, but several are partial or unverified.

## 28. Working, Partial, Broken, Missing

Working/source-verified:

- Registration, login, OTP verification, password reset.
- Role-protected routes and dashboard approval gate.
- Profile/KYC APIs.
- Worker search/details.
- Booking lifecycle, booking OTP fields, review flow.
- Chat rules, text/image message logic, receipts, presence.
- Admin stats/users/workers/bookings/approvals/audit logs.
- In-app notifications.
- Backend health, backend tests, frontend lint, frontend build.

Partial/unverified:

- Manual payment updates.
- Geocoder config.
- Browser push delivery.
- File uploads.
- Responsive UI.
- Live tracking.
- SMTP delivery.

Broken: none conclusively verified.

Missing/not found: real payment gateway, refund gateway flow, commission/payout engine, SMS/WhatsApp integration, Docker files, migration files, GitHub CI workflow, production monitoring/APM, full browser E2E screenshot suite.

## 29. Production Readiness Assessment

Assessment: not fully production-ready for real-money or high-scale public launch.

Ready/strong areas: backend health works, MongoDB connected locally, frontend build and lint pass, backend tests pass, Render deployment blueprint exists, security basics exist, Cloudinary-based uploads configured.

Needs before production: real payment provider, hardened auth/session strategy, browser E2E tests for all roles, upload/email/push/map verification, monitoring/log aggregation, geocoder variable configuration, scalable search/location improvements.

## 30. Hackathon Relevance Analysis

Existing reusable concepts as inspiration: service marketplace model, customer/worker/admin roles, booking lifecycle, KYC/admin trust layer, OTP-secured job start/completion, chat and presence, location-based discovery, multilingual support.

Do not copy current code if hackathon rules forbid existing projects. Rebuild a small version around the best ideas.

Weaknesses hackathon version should solve: manual payments, basic provider matching, no AI request understanding, no urgency detection, no explainable ranking, no image-based issue recognition, limited analytics.

Innovation opportunities:

| Idea | Problem solved | Technical approach | 24h feasibility | Demo value |
| --- | --- | --- | --- | --- |
| AI request parser | Users may not know category | LLM extracts service, urgency, location, notes | High | High |
| Voice service request | Faster mobile entry | Web Speech API + multilingual parsing | High | High |
| Image issue detection | Hard-to-describe repairs | Photo upload + AI classification | Medium | Very high |
| Urgency classifier | Emergency prioritization | Rules/LLM urgency score | High | High |
| Explainable provider ranking | Trust | Rank by distance, rating, availability, skill match | High | High |
| Safety checklist | Prevent unsafe actions | AI-generated guidance per service | High | Medium |
| Demand hotspot map | Admin insights | Aggregate requests by area | Medium | High |
| Reliability score | Better trust | Completion rate, cancellation, reviews | Medium | Medium |

Recommended 24-hour MVP:

Must build: customer request form with text/voice, AI category and urgency extraction, worker matching by skill/distance/availability/rating, simple booking request/status, worker accept/reject, admin demo dashboard.

Should build: multilingual input, explainable ranking, photo classification, in-app notifications, seed demo data.

Could build: chat, live tracking mock, review score, push notification demo.

Do not build: real payments, full KYC workflow, payout/commission engine, complex admin CRUD.

Suggested demo flow:

```text
User says: "AC is leaking water urgently"
-> AI detects AC repair + high urgency
-> App ranks nearby available AC workers with explanation
-> Customer books top worker
-> Worker accepts
-> Admin sees request and demand area
-> OTP/review simulation completes the job
```

## 31. Evidence Index

- Overview: `README.md`, `PROJECT_OVERVIEW.md`
- Commands/dependencies: root `package.json`, `backend/package.json`, `frontend/package.json`
- Deployment: `render.yaml`
- Express app: `backend/app.js`
- Server/Socket.IO: `backend/index.js`
- Auth: `backend/controllers/authController.js`, `backend/middleware/authMiddleware.js`
- Booking: `backend/controllers/bookingController.js`, `backend/utils/bookingRules.js`, `backend/models/Booking.js`
- Admin: `backend/controllers/adminController.js`, `backend/routes/adminRoutes.js`
- Marketplace/location: `backend/controllers/marketplaceController.js`, `backend/controllers/locationController.js`
- Chat: `backend/controllers/chatController.js`, `backend/utils/chatAccess.js`
- Notifications: `backend/controllers/notificationController.js`, `backend/services/pushNotificationService.js`
- Uploads: `backend/config/cloudinary.js`
- Models: `backend/models/*.js`
- Frontend routes/API/auth: `frontend/src/App.jsx`, `frontend/src/services/api.js`, `frontend/src/context/AuthContext.jsx`
- Runtime: `GET http://localhost:5000/api/health`

## 32. Final Metrics

| Metric | Count |
| --- | ---: |
| Features found | 38 |
| API endpoints found | 46 |
| Database model files found | 13 |
| Working/source-verified features | 31 |
| Partial/not fully verified features | 7 |
| Verified broken features | 0 |
| Critical issues | 0 |
| High issues | 2 |
| Medium issues | 4 |
| Low issues | 2 |

Could not fully test:

- Complete customer browser flow.
- Complete worker browser flow.
- Complete admin browser flow.
- Responsive layout at requested widths.
- Real uploads.
- SMTP email delivery.
- Browser push delivery.
- Real live tracking.
- Production deployed URL.
- Real payment flow, because no real gateway integration exists.

## Final Conclusion

InstantSeva is a substantial full-stack marketplace prototype with real backend and frontend implementation across authentication, worker discovery, booking, OTP-secured job lifecycle, chat, notifications, KYC/admin approval, multilingual support, and deployment preparation.

The strongest next work is production hardening: real payments, safer token/session handling, browser E2E testing, upload/email/push verification, monitoring, and scalable location search. For hackathon use, the best path is to rebuild a lean version focused on AI request understanding, urgency classification, explainable worker matching, multilingual voice input, and a crisp end-to-end demo.


---

# Final Runtime Verification Update

Update date: 2026-07-14

This section replaces the mistakenly appended raw verification prompt. It records the actual runtime verification performed after the source-code audit. Existing audit sections above remain valid and unchanged.

## Verification Scope Actually Completed

| Verification ID | Area | Previous Status | Current Status | Evidence |
| --- | --- | --- | --- | --- |
| FV-01 | Backend dependency/test chain | Partial/source verified | RUNTIME VERIFIED - PASS | `npm test --prefix backend` passed |
| FV-02 | Frontend lint | Partial/source verified | RUNTIME VERIFIED - PASS | `npm run lint --prefix frontend` passed |
| FV-03 | Frontend production build | Partial/source verified | RUNTIME VERIFIED - PASS | `npm run build --prefix frontend` passed |
| FV-04 | Root full test chain | Not run | RUNTIME VERIFIED - PASS | `npm test` passed |
| FV-05 | Backend health endpoint | Runtime partially verified | RUNTIME VERIFIED - PASS | `GET /api/health` returned 200 |
| FV-06 | MongoDB connection | Runtime partially verified | RUNTIME VERIFIED - PASS | health response: `database: connected` |
| FV-07 | Frontend build served by backend | Runtime partially verified | RUNTIME VERIFIED - PASS | health response: `frontendBuild: true`; `GET /` returned 200 |
| FV-08 | Public marketplace worker search API | Source verified only | RUNTIME VERIFIED - PASS | `GET /api/marketplace/workers?service=plumber&limit=5` returned 200 with one approved available plumber |
| FV-09 | Public browser render smoke: home | Browser not tested | RUNTIME VERIFIED - PASS | Screenshot: `docs/instantseva-audit/evidence/browser/home-1366.png` |
| FV-10 | Public browser render smoke: search mobile | Browser not tested | RUNTIME VERIFIED - PASS | Screenshot: `docs/instantseva-audit/evidence/browser/search-390.png` |
| FV-11 | Unauthenticated protected API access | Source verified only | RUNTIME VERIFIED - PASS | `/api/bookings`, `/api/chat`, `/api/admin/stats`, `/api/notifications/push/public-key` returned 401 without token |
| FV-12 | VAPID/push config presence | Partial | PARTIAL - CONFIGURED BUT BROWSER DELIVERY NOT TESTED | health response shows push optional env group has no missing vars; protected push public-key endpoint correctly requires auth |
| FV-13 | SMTP config presence | Partial | PARTIAL - CONFIGURED BUT EMAIL DELIVERY NOT CONFIRMED | health response shows SMTP optional env group has no missing vars; inbox delivery was not tested |
| FV-14 | Cloudinary config presence | Partial | PARTIAL - CONFIGURED BUT REAL UPLOAD NOT TESTED | health response shows Cloudinary optional env group has no missing vars; no safe test upload was performed |
| FV-15 | Nominatim/geocoder config | Partial | PARTIAL - MISSING CONFIG | health response reports `geocoder: [NOMINATIM_USER_AGENT]` missing |
| FV-16 | Full customer browser E2E | Not verified | BLOCKED - NOT EXECUTED IN THIS PASS | Playwright not installed; only public home/search smoke screenshots captured |
| FV-17 | Full worker browser E2E | Not verified | BLOCKED - NOT EXECUTED IN THIS PASS | No authenticated two-role browser automation completed |
| FV-18 | Full admin browser E2E | Not verified | BLOCKED - NOT EXECUTED IN THIS PASS | No authenticated admin browser automation completed |
| FV-19 | Three-role customer-worker-admin transaction | Not verified | BLOCKED - NOT EXECUTED IN THIS PASS | No controlled temporary three-role browser dataset was created |
| FV-20 | Real-time chat E2E | Source verified/tested by unit smoke only | PARTIAL - AUTOMATED LOGIC TESTED, BROWSER REAL-TIME NOT TESTED | root `npm test` passed chat/API smoke; no two-browser chat session executed |
| FV-21 | Socket.IO live tracking | Source verified/tested by helper tests only | PARTIAL - HELPER TESTED, TWO-SESSION TRACKING NOT TESTED | backend presence tests passed; no live map tracking browser session executed |
| FV-22 | Responsive UI full matrix | Not verified | PARTIAL - TWO SCREENSHOT SMOKES ONLY | captured `1366x768` home and `390x844` search; full viewport matrix not executed |
| FV-23 | Production deployment verification | Not verified | BLOCKED - NO DEPLOYED URL FOUND IN LOCAL CONFIG/DOCS | `render.yaml` exists, but no actual production URL was provided or discovered |
| FV-24 | Manual payment boundary | Source/unit verified | PARTIAL - LOGIC TESTS PASSED, BROWSER FLOW NOT TESTED | backend test output includes payment status transition rules |

## Runtime Commands Executed

| Command/Test | Result | Notes |
| --- | --- | --- |
| `npm test --prefix backend` | PASS | Booking, chat access, security/upload helpers, i18n, and presence tests passed |
| `npm run lint --prefix frontend` | PASS | ESLint completed successfully |
| `npm run build --prefix frontend` | PASS | Vite production build completed successfully |
| `npm test` | PASS | Root chain passed: lint, i18n checks, UI safeguards, voice/search smoke, e2e smoke, build, backend syntax checks, backend tests |
| `GET http://localhost:5000/api/health` | PASS | HTTP 200, DB connected, frontend build true |
| `GET http://localhost:5000/` | PASS | HTTP 200 served app shell |
| `GET /api/marketplace/workers?service=plumber&limit=5` | PASS | HTTP 200, returned one approved available plumber worker |
| Headless Chrome screenshot `/` at `1366x768` | PASS | Evidence file created |
| Headless Chrome screenshot `/search` at `390x844` | PASS | Evidence file created |
| Unauthenticated protected API checks | PASS | Protected APIs returned 401 as expected |

Root `npm test` also emitted translation fallback warnings for non-English locale files. The command still passed. Example: many locale files fall back to English for untranslated keys such as `common.searchOnMap`, `common.enterManually`, and address helper strings.

## Health Check Result

Runtime health response summary:

```text
HTTP status: 200
service: InstantSeva API
database: connected
frontendBuild: true
missingRequired: none
smtp: configured
cloudinary: configured
push: configured
geocoder: missing NOMINATIM_USER_AGENT
```

Secrets were not printed.

## Browser Evidence Captured

| Evidence | Path | Result |
| --- | --- | --- |
| Home desktop smoke screenshot | `docs/instantseva-audit/evidence/browser/home-1366.png` | Created |
| Search mobile smoke screenshot | `docs/instantseva-audit/evidence/browser/search-390.png` | Created |

This confirms that the built frontend can be served and rendered by headless Chrome for public routes. It does not prove full authenticated browser E2E.

## Authorization Runtime Checks

| Test | Actor | Target | Expected | Actual | Result |
| --- | --- | --- | --- | --- | --- |
| Missing auth token | Guest | `GET /api/bookings` | 401 | 401 | PASS |
| Missing auth token | Guest | `GET /api/chat` | 401 | 401 | PASS |
| Missing auth token | Guest | `GET /api/admin/stats` | 401 | 401 | PASS |
| Missing auth token | Guest | `GET /api/notifications/push/public-key` | 401 | 401 | PASS |

Cross-role/IDOR tests with real customer, worker, and admin tokens were not executed in this pass.

## Integration Runtime Status

| Integration | Current Status | Runtime Evidence | Remaining Work |
| --- | --- | --- | --- |
| MongoDB | RUNTIME VERIFIED - PASS | `/api/health` reports `connected` | None for connectivity |
| Cloudinary | PARTIAL - CONFIGURED | health optional group shows Cloudinary variables configured | Perform real avatar/KYC/chat image uploads with safe test files |
| SMTP | PARTIAL - CONFIGURED | health optional group shows SMTP variables configured | Trigger OTP/reset email and confirm SMTP acceptance/inbox delivery without exposing OTPs |
| Browser Push | PARTIAL - CONFIGURED | health optional group shows push variables configured; protected endpoint requires auth | Authenticated browser permission/subscription/delivery test |
| Socket.IO | PARTIAL | backend presence tests passed | Two authenticated browser sessions for chat/tracking |
| Live tracking | PARTIAL | source and helper behavior verified by tests | Real accepted/in-progress booking with worker location event and customer map update |
| Nominatim/geocoder | PARTIAL - MISSING CONFIG | health reports missing `NOMINATIM_USER_AGENT` | Configure safe user agent and run autocomplete/distance ordering tests |
| Production | BLOCKED | no production URL found/provided | Provide deployed URL or Render deployment output |

## Updated Feature Status Changes

| Feature | Previous Status | Updated Status |
| --- | --- | --- |
| Backend tests | Partial | RUNTIME VERIFIED - PASS |
| Frontend lint/build | Partial | RUNTIME VERIFIED - PASS |
| Root full test chain | Not run | RUNTIME VERIFIED - PASS |
| Public app shell load | Not browser tested | RUNTIME VERIFIED - PASS for `/` smoke |
| Public search page load | Not browser tested | RUNTIME VERIFIED - PASS for `/search` smoke |
| Marketplace worker search API | Source verified | RUNTIME VERIFIED - PASS |
| Missing-auth protection | Source verified | RUNTIME VERIFIED - PASS for selected protected APIs |
| Full authenticated customer flow | Not verified | BLOCKED - not executed |
| Full authenticated worker flow | Not verified | BLOCKED - not executed |
| Full authenticated admin flow | Not verified | BLOCKED - not executed |
| Three-role service transaction | Not verified | BLOCKED - not executed |
| Real uploads | Not verified | PARTIAL - config only |
| SMTP | Not verified | PARTIAL - config only |
| Push notifications | Not verified | PARTIAL - config only |
| Live tracking | Not verified | PARTIAL - helper/source only |
| Production deployment | Not verified | BLOCKED - no URL |

## Strict Completion Checklist

| Question | Answer | Reason / Blocker / Required Next Action |
| --- | --- | --- |
| Was customer E2E browser-tested? | NO | Only public smoke pages were captured. Need authenticated test customer and browser automation. |
| Was worker E2E browser-tested? | NO | Need authenticated worker context and controlled booking. |
| Was admin E2E browser-tested? | NO | Need authenticated admin browser context. |
| Was a complete three-role transaction tested? | NO | No controlled temporary customer/worker/admin transaction was created. |
| Were all specified viewports tested? | NO | Only `1366x768` home and `390x844` search screenshots were captured. |
| Was browser console checked? | NO | Headless screenshot command does not capture console logs. Need Playwright/CDP/browser automation. |
| Was browser network activity checked? | PARTIAL | HTTP API checks were run manually; full browser network audit was not done. |
| Was real Cloudinary upload tested? | NO | Config verified only. Need safe upload files and authenticated sessions. |
| Was SMTP actually tested? | NO | Config verified only. Need trigger email flow and SMTP/inbox confirmation. |
| Was browser push actually tested? | NO | Config verified only. Need authenticated browser permission/subscription and trigger. |
| Was Socket.IO tested with two sessions? | NO | Presence helper tests passed, but no two-browser session. |
| Was live tracking tested? | NO | Needs accepted/in-progress booking and worker location event. |
| Was chat tested in real time? | NO | Chat access tests passed, but no real-time browser chat. |
| Was cross-role authorization tested? | PARTIAL | Missing-token protected endpoints returned 401; cross-role token/IDOR tests not run. |
| Was IDOR behavior tested safely? | NO | Requires multiple authenticated test accounts and resource IDs. |
| Was location/geocoder tested? | PARTIAL | Worker search API worked; geocoder config missing `NOMINATIM_USER_AGENT`. |
| Was manual payment logic tested? | PARTIAL | Unit/root test chain covered payment status rules; browser/API transaction not run. |
| Was data persistence verified? | PARTIAL | Existing API returned persisted worker data; new E2E persistence flow not run. |
| Was production checked? | NO | No deployed URL found/provided. |
| Were all blocking failures documented? | YES | Blockers are listed in this section. |
| Were all code changes documented? | YES | No application source-code fixes were made. Only `project-details.md` was corrected/updated. |
| Was final regression testing completed? | YES for automated chain | `npm test`, frontend build/lint, backend tests passed. Browser regression flow was not completed. |

## Verification Fix Log

No application source-code fixes were made during this verification update.

Documentation changes only:

- Removed the mistakenly appended raw verification prompt from `project-details.md`.
- Added this actual runtime verification update section.
- Created browser evidence screenshots under `docs/instantseva-audit/evidence/browser/`.

## Final Runtime Metrics

| Metric | Count |
| --- | ---: |
| Runtime/automation checks recorded | 14 |
| Passed | 10 |
| Partial | 6 |
| Blocked/not executed | 6 |
| Failed | 0 |
| Browser screenshots captured | 2 |
| Protected unauthenticated API checks | 4 |
| Critical issues | 0 |
| High issues remaining | 2 |
| Medium issues remaining | 4 |
| Low issues remaining | 2 |

Final status: the automated build/test/API/public-browser smoke layer is verified as passing. Full authenticated E2E, real external integrations, two-session real-time behavior, full responsive matrix, and production verification remain incomplete until proper browser automation/accounts and production URL are available.
