# HyperlocalMarket

Full-stack hyperlocal services marketplace with customer booking, worker KYC/profile management, admin approvals, chat, reviews, audit logs, and notification persistence.

## Structure

- `backend` - Express, MongoDB, Socket.IO, Cloudinary, Nodemailer
- `frontend` - React, Vite, Tailwind CSS

## Setup

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Copy environment files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Fill in MongoDB, SMTP, Cloudinary, and JWT values in `backend/.env`.

## Development

```bash
npm run dev
```

The frontend defaults to `http://localhost:5173` and the backend defaults to `http://localhost:5000`.

## Useful Scripts

```bash
npm run lint
npm run build
npm run check:backend
npm test
npm run seed --prefix backend
```

## Seed Users

After configuring `backend/.env`, run:

```bash
npm run seed --prefix backend
```

The seed script upserts sample users and marketplace data without deleting existing records:

- Admin: `admin@hyperlocal.test` / `password123`
- Customer: `customer@hyperlocal.test` / `password123`
- Worker: `worker@hyperlocal.test` / `password123`

## Current Limitations

Payments are manual prototype actions. Replace manual payment updates with a real provider before handling real transactions.

JWTs are stored client-side for development speed. For production, move toward HTTP-only cookies, shorter-lived access tokens, refresh token rotation, and a logout invalidation strategy.
