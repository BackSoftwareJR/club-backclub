# Club CRM Frontend

React 19 SPA for the Club CRM member and admin experience.

## Stack

- React 19 + Vite + TypeScript
- TanStack Router (file-based routing)
- Tailwind CSS v4 with CSS variable theming
- Framer Motion + GSAP (wired, cinematic animations in Phase 4)
- Radix UI primitives

## Setup

```bash
cd frontend
cp .env.example .env
npm install
```

Configure `VITE_API_URL` in `.env` (default: `http://localhost:8000/api`).

## Development

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### Demo entry URLs (after backend seed)

- Owner (PIN `123456`): `/entry/1/NFC-OWNER-001`
- Member (PIN setup): `/entry/1/NFC-MEMBER-001`

## Build

```bash
npm run build
```

Static output is written to `dist/` for Hostinger deployment.

## Preview production build

```bash
npm run preview
```

## Project structure

```
src/
├── routes/           # TanStack file-based routes
├── providers/        # Auth, Theme, Club, Toast
├── components/       # UI, auth, wallet, products, admin
├── hooks/            # useAuth, useIdleTimeout
├── lib/              # API client, pricing, storage, GSAP
├── types/            # Shared TypeScript types
└── styles/           # Tailwind + CSS variables
```
