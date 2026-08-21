# InstantSeva Project Overview

InstantSeva is a full-stack hyperlocal service marketplace that connects customers with nearby verified service professionals such as plumbers, electricians, tutors, cleaners, AC technicians, drivers, cooks, caretakers, and other local workers.

The project is built as a production-oriented marketplace with customer booking, worker onboarding, admin verification, real-time chat, live availability, location-aware worker discovery, multilingual support, push notifications, SEO support, centralized service availability controls, strict role-based access control (RBAC), and verification-driven trust flows.

---

## 1. Product Goal

The main goal of InstantSeva is to make local services easy to discover, book, verify, and complete safely.

The platform supports three main roles:

- **Customer (`user`)**: searches services, chats with workers or other users, books jobs, tracks accepted services, verifies OTPs, and reviews completed work.
- **Worker (`worker`)**: completes profile and KYC, manages skills/pricing/availability, accepts or rejects jobs, chats with customers or other workers, and completes jobs through OTP verification. Workers operate in a dedicated workspace and do not receive customer service-discovery or booking interfaces.
- **Admin (`admin`)**: verifies users/workers, manages accounts, reviews uploaded documents, monitors bookings, reviews audit logs, manages platform settings, and controls marketplace quality.

---

## 2. Core Features

### Public Website & Service Discovery

- Responsive home page for desktop, tablet, and mobile.
- Public service categories and service discovery for guests and customers.
- Centralized service availability system ensuring only active services (Home Tutor, Electrician, Plumber) are displayed and bookable.
- Search page available before login for customers and guests.
- Public worker profile preview.
- SEO metadata, sitemap, robots file, Open Graph data, and structured data.
- Public users can explore services, but booking and chat require login and profile approval.
- Role isolation: Logged-in workers and admins are automatically redirected to their respective dashboards when visiting public discovery routes.

### Authentication & Role-Based Access Control (RBAC)

- User and worker registration with email OTP verification.
- Login with JWT authentication.
- Forgot password and reset password flow.
- Strict role protection on both frontend routes and backend APIs:
  - `CustomerOrGuestRoute`: Guards `/`, `/search`, `/workers/:workerId` (redirects workers to `/worker/dashboard` and admins to `/admin/dashboard`).
  - `ProtectedRoute`: Role-enforced routing (`/dashboard/*` for users, `/worker/dashboard/*` for workers, `/admin/dashboard/*` for admins).
  - Already-authenticated users visiting `/login` or `/signup` are redirected to their post-auth dashboard.
  - Backend authorization: `customerOrGuestOnly` blocks workers from calling customer marketplace discovery endpoints; `authorize('user')` blocks non-customers from booking APIs; `authorize('worker')` and `authorize('admin')` guard their respective controllers.
- Dashboard access gate based on profile completion and admin approval.

### Customer Flow

1. Register and verify email.
2. Complete profile and upload KYC document.
3. Wait for admin verification.
4. Access customer dashboard after approval.
5. Search workers by active service (Home Tutor, Electrician, Plumber) and location.
6. View worker availability and online presence.
7. Chat with workers or other users through persistent real-time messaging.
8. Book a service with address, location, schedule, and notes.
9. Track accepted booking details.
10. Give Start OTP to begin the job.
11. Give Completion OTP after the service is finished.
12. Review the completed booking.

### Worker Flow

1. Register as worker and verify email.
2. Complete worker profile with skills, bio, pricing, and experience.
3. Upload KYC document.
4. Wait for admin approval.
5. Access dedicated worker dashboard after approval.
6. Set availability status (Available / Busy / Offline).
7. Receive booking requests with customer details and service destination.
8. Accept or reject jobs.
9. Chat directly with customers or other workers.
10. Use customer OTP to start and complete services.
11. Track earnings, completed jobs, rating statistics, and job history.

### Admin Flow

- View dashboard statistics (users, workers, pending KYC, bookings, revenue).
- Open clickable user, worker, and booking directories.
- Add users and workers from admin dashboard.
- Soft-delete/suspend users and workers.
- Review KYC queue with document preview modal.
- Approve or reject identity verification.
- View booking records and live status.
- View audit logs for important platform actions.

### Real-Time Persistent Chat & Messaging System

- **Full Relationship Matrix**:
  - `User ↔ User` ✅
  - `User ↔ Worker` ✅
  - `Worker ↔ User` ✅
  - `Worker ↔ Worker` ✅
  - `Admin Support Chats` ✅
  - Self-chat is blocked.
- **Booking-Independent**: Users and workers can chat at any time without requiring an active booking.
- **Persistent Storage**: All conversations (`Chat`) and messages (`Message`) are stored in MongoDB with timestamps, delivered status, and read status. Full conversation history survives logout and re-login.
- **Conversation Deduplication**: Opening or starting a chat with an existing contact automatically resumes the existing conversation thread.
- **`+ New Chat` Modal & Professional Worker Selection UI**:
  - Allows searching registered users and workers by name, phone, email, and service/skills (e.g. searching "electrician" matches electricians).
  - Role filter tabs (`All`, `Users`, `Workers`).
  - **Worker Result Cards**: Displays profile avatar, online presence dot, name, `Worker` badge, availability status (`Available`, `Busy`, `Offline`), primary profession badge (e.g., `⚡ Electrician`, `🔧 Plumber`, `📚 Home Tutor`), rating (`⭐ 4.8 (126 reviews)` or `⭐ New`), and years of experience.
  - **User Result Cards**: Displays clean card with avatar, presence dot, name, `User` role badge, and contact information without irrelevant worker metrics.
- **Role Badges**: Clear badges (`User`, `Worker`, `Admin`) shown in conversation list and active chat header.
- **Unread Message Tracking**: Dynamic unread badges in conversation list; automatically marked as read upon viewing.
- **Real-Time Synchronization**: Powered by Socket.IO for instant message delivery, double-tick receipts (`sent`, `delivered`, `read`), and online presence dots.
- **User ↔ User Profile & Completed Service History**:
  - In User ↔ User conversations, User A can click User B's name or the "View Profile" action button to open User B's public profile modal.
  - Displays safe public info: Profile avatar, presence indicator, name, `User` role badge, and member since date.
  - **Completed Service History**: Displays a clean summary of services taken by User B (e.g. `⚡ Electrician - Amit Kumar`, `🔧 Plumber - Rahul Sharma`), completion date, worker rating, and status (`Completed`).
  - **Direct "Discuss" Action**: User A can click "Discuss" on any service history entry to instantly ask User B about their experience with that worker in the chat.
  - **Strict Privacy**: Full addresses, GPS coordinates, payment amounts, payment methods, OTPs, and private booking notes are strictly excluded on the backend.
  - **Authorization**: Access to another customer's public profile is restricted to active conversation partners and platform admins.
- **Media Support**: Supports sending both text messages and images (via Cloudinary).
- **Integrated Access Points**: Available in Customer Dashboard navigation bar and Quick Chat banner, Worker Dashboard sidebar, Navbar icon, and direct "Chat with Worker/Customer" buttons on booking cards.

---

## 3. Central Service Availability System

InstantSeva includes a centralized configuration to control which services are active across the platform:

- **Central Source of Truth**: [`shared/serviceAvailability.json`](file:///d:/Projects/Antigravity/Startup/shared/serviceAvailability.json)
- **Currently Active Services**:
  1. `plumber` (`active: true`)
  2. `electrician` (`active: true`)
  3. `home tutors` (`active: true`)
- **Inactive / Future Services**: All other services (`carpenters`, `ac repair/service`, `painters`, `house cleaner`, etc.) are set to `false`. Their profile metadata, schemas, and translations are preserved for future activation.
- **Backend Enforcement**: [`backend/utils/supportedServices.js`](file:///d:/Projects/Antigravity/Startup/backend/utils/supportedServices.js) and [`backend/controllers/marketplaceController.js`](file:///d:/Projects/Antigravity/Startup/backend/controllers/marketplaceController.js) derive active services dynamically and return `serviceUnavailable: true` when a user searches for an inactive known service.
- **Frontend Enforcement**: Home page category grid, Dashboard service cards, and Search empty state differentiate between unavailable known services (showing an availability warning + suggested active services) vs unknown search terms.
- **Activation Procedure**: To activate a service in the future, change its boolean value in `shared/serviceAvailability.json` from `false` to `true` and deploy.

---

## 4. Technology Stack

### Frontend

- React 19 for UI.
- Vite for development and production builds.
- Tailwind CSS 4 for styling.
- React Router for routing and role-based guards.
- Axios for API communication.
- React Context for authentication state.
- React Hot Toast for UI notifications.
- Socket.IO client for real-time chat, notifications, and presence.
- Leaflet and React-Leaflet for map and location UI.
- i18next and react-i18next for multilingual support (22 scheduled Indian languages).
- Lucide React for icons.
- Framer Motion for UI animation.

### Backend

- Node.js with Express.
- MongoDB with Mongoose.
- Socket.IO for real-time messaging, status updates, and live presence.
- JWT authentication.
- bcrypt password hashing.
- Multer and Cloudinary for media and KYC uploads.
- Nodemailer for email and OTP delivery.
- Web Push with VAPID keys for browser notifications.
- Helmet and CORS for security headers and origin protection.
- Express Rate Limit for abuse prevention.

### Shared Code

- `shared/serviceAvailability.json`: Central source of truth for active vs inactive services.
- `shared/serviceKeywords.json`: Multilingual service keyword mappings used by frontend and backend search logic.

---

## 5. Project Structure

```text
Startup/
  backend/
    config/          Backend configuration: database, Cloudinary, env validation.
    controllers/     API business logic for auth, admin, booking, chat, user, worker, marketplace, location.
    middleware/      Auth, role checks, customerOrGuestOnly, language handling, rate limiters.
    models/          MongoDB schemas (User, WorkerProfile, Booking, Chat, Message, Review, Notification, etc.).
    routes/          Express route definitions (auth, admin, booking, chat, user, worker, marketplace).
    scripts/         Seed and admin helper scripts.
    services/        OTP, push notifications, location services.
    tests/           Backend unit and smoke tests (bookingRules, chatAccess, securityAndUploads, serverI18n, presence).
    utils/           Reusable backend helpers (supportedServices, chatAccess, userAccess, presence, etc.).
    app.js           Express app setup.
    index.js         HTTP and Socket.IO server entry point.

  frontend/
    public/          Static assets, SEO files, manifest.
    scripts/         Frontend integrity and smoke checks.
    src/
      components/    Reusable UI components (Navbar, BrandLogo, TrackingMap, SearchEmptyState, etc.).
      constants/     Static app constants (professions derived from shared config).
      context/       Auth context and global state.
      i18n/          Translation setup and 22 locale JSON files.
      pages/         Route-level pages (Home, Search, WorkerProfile, Dashboard, WorkerDashboard, AdminDashboard, Chat, Profile, etc.).
      services/      Axios API client and Socket.IO connection manager.
      utils/         Client helpers for images, search, multilingual keywords, onboarding, presence, formatters, workerAvailability.
    vite.config.js   Vite configuration.

  shared/
    serviceAvailability.json   Central service status configuration.
    serviceKeywords.json       Multilingual keyword dictionary.

  package.json
  render.yaml
  PROJECT_OVERVIEW.md
  README.md
```

---

## 6. Frontend Pages & Routing

The frontend includes these main pages:

- `Home.jsx`: Public landing page and service discovery (guarded by `CustomerOrGuestRoute`).
- `Search.jsx`: Service search and worker listing (guarded by `CustomerOrGuestRoute`).
- `WorkerProfile.jsx`: Worker detail and booking page (guarded by `CustomerOrGuestRoute`).
- `Signup.jsx`: User/Worker registration (redirects authenticated users to their dashboard).
- `Login.jsx`: User/Worker/Admin login (redirects authenticated users to their dashboard).
- `VerifyOTP.jsx`: Email OTP verification.
- `ForgotPassword.jsx`: Password reset request.
- `Dashboard.jsx`: Customer dashboard with navigation bar and Quick Chat CTA (`ProtectedRoute role="user"`).
- `WorkerDashboard.jsx`: Worker dashboard with sidebar chat navigation (`ProtectedRoute role="worker"`).
- `AdminDashboard.jsx`: Admin control panel (`ProtectedRoute role="admin"`).
- `Chat.jsx`: Persistent real-time messaging for authenticated users and workers (`ProtectedRoute` available at `/messages`, `/chat`, and `/chat/:chatId`).
- `Profile.jsx`: Profile completion, KYC upload, and onboarding status.
- `EditProfile.jsx`: Profile and avatar editing.
- `NotFound.jsx`: Role-aware 404 fallback page.

---

## 6.1. InstantSeva Global UI Design System

A centralized, responsive, production-quality UI design system established for the entire application:

- **Design Tokens & Theme (`frontend/src/index.css`, `frontend/src/constants/designTokens.js`)**:
  - **Colors**: Primary Violet/Indigo palette (`#7c3aed` primary CTA), crisp slate neutrals (`slate-50` background to `slate-900` text), and semantic status colors (Emerald, Amber, Rose, Blue).
  - **Elevations**: 5-level elevation system (`elevation-0`, `elevation-1`, `elevation-2`, `elevation-3`, `elevation-modal`).
  - **Typography**: Dual-font stack (`Outfit` for headings, `Inter` for body) with full multilingual and Indic script support.
  - **Mobile Touch Standards**: Minimum 44px touch targets across all interactive controls.
- **Atomic UI Primitives (`frontend/src/components/ui/`)**:
  - `Button.jsx`: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `link`), sizes (`sm`, `md`, `lg`, `icon`), loading spinner, focus-ring.
  - `Input.jsx`: Form inputs with accessible labels, helper text, error messages, and icon slots.
  - `SearchInput.jsx`: Universal search input with voice search trigger, clear button, and loader.
  - `Select.jsx` & `Textarea.jsx`: Styled form inputs.
  - `Badge.jsx`: Standardized status badges with semantic icons and dots.
  - `Rating.jsx`: Star rating score display and interactive rating mode.
  - `Card.jsx`: Multi-variant container card (`flat`, `elevated`, `subtle`, `interactive`).
  - `Avatar.jsx`: User/Worker avatars with live presence dots and fallbacks.
  - `Modal.jsx` & `Drawer.jsx`: Accessible modal dialogs with mobile bottom-sheet behavior and slide-over drawers.
  - `Tabs.jsx`: Pill and underline tab bars.
  - `Skeleton.jsx`: Shimmer skeleton loading components.
  - `EmptyState.jsx` & `ErrorState.jsx`: Standard empty and error state screens with CTAs.
  - `Pagination.jsx`: Accessible pagination controls.
  - `Table.jsx`: Clean desktop data tables.
- **Domain-Specific Cards (`frontend/src/components/cards/`)**:
  - `ServiceCard.jsx`: Service discovery card highlighting active services (`Home Tutor`, `Electrician`, `Plumber`).
  - `WorkerCard.jsx`: Worker card with avatar, presence dot, ratings, skills, availability, and direct actions.
  - `StatCard.jsx`: Metric display cards with trend indicators.
  - `BookingCard.jsx`: Booking lifecycle card with status badges, partner info, and OTP chips.
  - `ChatListItem.jsx` & `ChatBubble.jsx`: Standardized messaging cards with read/delivered status receipts.
- **Responsive Layout Shells (`frontend/src/components/layout/`)**:
  - `AppHeader.jsx`: Universal top navigation header with logo, language selector, and user menu.
  - `DashboardSidebar.jsx`: Collapsible desktop sidebar with role-isolated navigation items.
  - `MobileBottomNav.jsx`: Dedicated mobile bottom navigation bar with role-specific tabs.
  - `DashboardLayout.jsx`: Complete responsive shell integrating sidebar, header, and content.

---

## 7. Backend API Areas

Main route groups:

- `/api/auth`: Registration, login, current user, OTP verification, password reset.
- `/api/user`: Customer profile update, avatar upload, customer KYC upload (`authorize('user')`), and `GET /api/user/:userId/public-profile` (authorized public profile & completed service history for chat participants).
- `/api/worker`: Worker profile, worker KYC upload, availability/profile updates (`authorize('worker')`).
- `/api/marketplace`: Public worker/service discovery and worker details (`customerOrGuestOnly` blocks workers).
- `/api/bookings`: Booking creation (`authorize('user')`), status updates, payment status, reviews, OTP verification.
- `/api/chat`:
  - `GET /api/chat`: Get all user conversations with unread counts and presence.
  - `GET /api/chat/contacts`: Search registered users & workers for new chat (includes populated worker professional information and skill-based matching).
  - `GET /api/chat/:chatId`: Get messages with pagination and mark as read.
  - `POST /api/chat/initiate`: Create or retrieve deduplicated conversation.
  - `POST /api/chat/:chatId/messages`: Send validated text message.
  - `POST /api/chat/upload-image`: Send image message.
  - `PATCH /api/chat/:chatId/read`: Mark conversation messages as read.
- `/api/admin`: Stats, account management, identity approval, bookings, audit logs (`authorize('admin')`).
- `/api/notifications`: In-app notifications, push subscription, read status.
- `/api/health`: Deployment and environment health check.

---

## 8. Database Models

Important MongoDB models:

- `User`: Account, role (`user`, `worker`, `admin`), KYC, location, preferred language, soft-delete state.
- `WorkerProfile`: Skills, experience, bio, pricing, KYC, availability, approval status, rating stats.
- `Booking`: Customer, worker, service, schedule, status, OTPs, location, payment status.
- `Chat`: Participants array (`[User._id]`), `lastMessage` metadata, timestamps, indexes.
- `Message`: `chatId`, `sender`, `content`, `messageType` (`text` / `image`), `imageUrl`, `deliveredTo`, `readBy`, timestamps, indexes.
- `Review`: Verified booking reviews.
- `Notification`: In-app notification records.
- `PushSubscription`: Browser push subscription records.
- `OTP`: Email verification OTPs.
- `PasswordReset`: Password reset code records.
- `AuditLog`: Admin and critical action history.
- `CommonLocation`: Stored common locations and usage count.
- `WorkerModels`: Dynamic worker model helpers.

---

## 9. Verification and Trust System

InstantSeva uses multiple verification layers:

### Email Verification

- Registration requires email verification through OTP.
- OTP attempts are limited and tracked.
- Expired or incorrect OTPs are rejected.

### Profile Completion Gate

- Users and workers cannot access dashboard features until required profile details are complete.
- Customers must complete profile and submit customer KYC before dashboard access.
- Workers must complete profile, skills, bio, pricing, and submit worker KYC before dashboard access.

### Admin Approval Gate

- Admin reviews submitted identity documents in the verification review queue.
- Approved accounts gain full dashboard access.
- Rejected accounts receive notice and can re-upload documents.

### Booking OTP Protection

- Worker receives Start OTP after accepting a booking.
- Customer verifies Start OTP to begin the job.
- Customer receives Completion OTP after the job starts.
- Worker verifies Completion OTP to complete the job.
- Booking OTPs have expiry and failed-attempt protection.

---

## 10. Search and Location System

The marketplace search supports:

- Active service filtering (Home Tutor, Electrician, Plumber).
- Multilingual service keywords (`shared/serviceKeywords.json`).
- Nearest-to-farthest worker ordering.
- Worker availability status (Available, Busy, Offline).
- Online/offline presence indicators.
- Worker approval filtering.
- Soft-deleted worker filtering.
- Location-based coordinates and address fallback.
- Differentiated empty states (unavailable service with active suggestions vs unknown query).

---

## 11. Chat, Presence & Real-Time Messaging

The messaging architecture includes:

- **Socket.IO Real-Time Engine**: Connected with JWT token authentication and user-specific rooms.
- **Supported Conversations**: User ↔ User, User ↔ Worker, Worker ↔ User, Worker ↔ Worker, Admin support.
- **History & Retention**: Complete chat history is permanently stored in MongoDB and loaded on demand.
- **Receipts**: Live update of `sent` (single tick), `delivered` (double grey tick), and `read` (double green/emerald tick).
- **Presence**: Real-time broadcast of online/offline status and `lastSeenAt`.
- **Search Contacts**: Instant discovery of registered users and workers via `+ New Chat` modal with full profession, rating, review count, and availability details for workers.
- **Unread Tracking**: Aggregate unread badge counters per conversation.

---

## 12. Notifications

InstantSeva supports multiple notification layers:

- In-app notification records.
- Browser push notifications through Web Push and VAPID.
- Notification language selection based on user preferred language.
- Booking notifications.
- Chat message notifications.
- Review notifications.
- Payment/status notifications.
- Verification result notifications.

Required push environment values:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_CONTACT_EMAIL`

---

## 13. Multilingual System

InstantSeva includes multilingual support for all 22 scheduled Indian languages:

1. English
2. Hindi
3. Bengali
4. Telugu
5. Marathi
6. Tamil
7. Urdu (with RTL direction support)
8. Gujarati
9. Kannada
10. Odia
11. Malayalam
12. Punjabi
13. Assamese
14. Maithili
15. Santali
16. Kashmiri
17. Nepali
18. Konkani
19. Sindhi
20. Dogri
21. Manipuri
22. Bodo

---

## 14. Voice and Accessibility Features

- Voice input for search and voice service discovery.
- Text-to-speech support in selected language.
- Graceful fallback when speech APIs are unavailable.
- Responsive layouts for mobile, tablet, and desktop.
- Language direction handling for RTL (Urdu).

---

## 15. Admin Dashboard Details

Admin capabilities:

- View total users, workers, pending KYC count, paid bookings, and total bookings.
- Inspect matching records via clickable count cards.
- Search users, workers, and bookings.
- Add and soft-delete user/worker accounts.
- Review pending user and worker KYC with document preview modal.
- Approve or reject verification.
- View audit logs for security tracking.

---

## 16. Deployment Architecture

Designed for single-service deployment on Render:

1. Render runs root build command (`npm ci && npm run ci`).
2. Root build installs dependencies and builds frontend.
3. Backend starts with `npm start`.
4. Express serves API routes under `/api`.
5. Express serves `frontend/dist` for the React app.
6. SPA fallback serves `index.html` for frontend routes.
7. SEO files (`sitemap.xml`, `robots.txt`, `site.webmanifest`) are served directly.

---

## 17. Environment Variables

Important backend environment variables:

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `RENDER_EXTERNAL_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_NAME`
- `FROM_EMAIL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NOMINATIM_USER_AGENT`
- `GEOCODER_COUNTRY_CODES`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_CONTACT_EMAIL`

---

## 18. Security Measures

- Password hashing with bcrypt.
- JWT authentication.
- Strict role-based route protection (`user`, `worker`, `admin`).
- Customer/Guest route wrappers preventing workers from accessing customer discovery.
- Backend API authorization on bookings, KYC, worker, and admin routes.
- Dashboard access gating based on KYC approval.
- Email verification OTPs with attempt limiting and expiry.
- Rate limiters for auth, signup, login, OTP, chat, password reset, and location search.
- Helmet security headers and CORS allowlist.
- Soft-delete/suspend instead of immediate account data removal.
- Structured backend logging and audit log persistence.
- Message validation (content sanitization, length limit, authenticated sender binding).

---

## 19. Testing and Quality Checks

Root test command:

```bash
npm test
```

This command runs:

- Frontend ESLint.
- i18n locale integrity check.
- UI i18n/static smoke check.
- E2E-style route/API smoke check.
- Frontend production build.
- Backend syntax checks across all models, controllers, and middleware.
- Backend unit and integration tests:
  - Booking lifecycle rules.
  - Pricing calculation.
  - Pagination safety.
  - Payment status transition rules.
  - Regex escaping for search.
  - Chat access & role combination tests (`User ↔ User`, `User ↔ Worker`, `Worker ↔ User`, `Worker ↔ Worker`, self-chat rejection).
  - Role-based authorization middleware tests.
  - Booking OTP expiry and attempts.
  - Upload payload normalization.
  - Production env validation.
  - Server translations and presence helpers.

---

## 20. Local Development

Install dependencies:

```bash
npm install
```

Start backend and frontend together:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

---

## 21. One-Line Summary

InstantSeva is a verified, multilingual, location-aware hyperlocal service marketplace with customer booking, worker onboarding, admin approval, persistent role-based real-time chat with rich worker cards, push notifications, OTP-secured job completion, and production-ready deployment support.
