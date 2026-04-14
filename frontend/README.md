# HyperlocalMarket Frontend

React/Vite frontend for a hyperlocal services marketplace. Customers can discover approved workers, book services, chat, pay manually, and review completed work. Workers can manage KYC, profile details, availability, and jobs. Admins can approve workers and inspect audit logs.

## Setup

1. Install dependencies from the project root or this folder.
2. Copy `.env.example` to `.env`.
3. Start the API server.
4. Run the frontend dev server.

```bash
npm install
npm run dev --prefix frontend
```

## Environment

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Main Routes

- `/` home and service search entry
- `/search` worker discovery
- `/workers/:workerId` public worker profile
- `/profile` customer/worker booking history
- `/messages` realtime chat
- `/worker/dashboard` worker dashboard
- `/admin/dashboard` admin approval and audit area

## Notes

The current payment flow is manual. A production payment provider should replace the manual “Mark Paid” action before real money is handled.
