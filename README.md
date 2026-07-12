# Club CRM

Financial and behavioral platform for private clubs. Members authenticate via **NFC card + 6-digit PIN** (no public self-registration). Purchases consume **virtual wallet credits**; real-world cash flow is tracked separately in the **Treasury** (`club_ledger`).

**Production:** [club.backclub.it](https://club.backclub.it) (SPA) + [api.club.backclub.it](https://api.club.backclub.it) (API)

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React 19 SPA, Vite, TanStack Router — static build |
| API | Laravel 13 REST JSON (`/backend`) |
| Database | MySQL |
| Cache / Session / Queue | `database` driver (Hostinger-friendly) |

See the [Master Execution Plan](00_Master_Execution_Plan.md) for the definitive schema, API mapping, and business rules.

## Prerequisites

- PHP 8.3+
- Composer
- Node.js 20+
- MySQL 8+ (production) or SQLite (local/tests)

## Clone and local setup

```bash
git clone https://github.com/YOUR_USER/club-crm.git
cd club-crm
```

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Optional: configure DB_* for MySQL, or keep sqlite default
php artisan migrate --seed
php artisan serve
```

API base URL: `http://localhost:8000/api`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

SPA URL: `http://localhost:5173`

Set `VITE_API_URL=http://localhost:8000/api` in `frontend/.env`.

## Demo data (ClubSeeder)

After `php artisan migrate --seed`, **The Velvet Room** club is created with:

| Role | NFC UID | PIN | Entry URL |
|------|---------|-----|-----------|
| Owner (admin) | `NFC-OWNER-001` | `123456` | `http://localhost:5173/entry/1/NFC-OWNER-001` |
| Member | `NFC-MEMBER-001` | *(setup required)* | `http://localhost:5173/entry/1/NFC-MEMBER-001` |

The member card has no PIN yet — first scan shows the PIN setup screen. The owner can access the admin dashboard after login.

## Verification

```bash
cd backend && php artisan test
cd frontend && npm run build
```

CI runs the same checks on push (see `.github/workflows/ci.yml`).

## Deployment

| Doc | Purpose |
|-----|---------|
| [docs/DEPLOY_HOSTINGER.md](docs/DEPLOY_HOSTINGER.md) | Full Hostinger guide for club.backclub.it |
| [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md) | Ordered deploy-day checklist |
| [docs/hostinger/README.md](docs/hostinger/README.md) | Apache `.htaccess` file placement |
| [docs/CANOPYWAVE_SETUP.md](docs/CANOPYWAVE_SETUP.md) | AI (Canopywave) production keys |

### Production environment templates

- Backend: `backend/.env.production.example` → copy to `.env` on server
- Frontend: `frontend/.env.production.example` → copy to `.env.production` before `npm run build`

### Production URLs

| Service | URL |
|---------|-----|
| SPA | `https://club.backclub.it` |
| API | `https://api.club.backclub.it` |
| API base (frontend) | `https://api.club.backclub.it/api` |
| NFC entry | `https://club.backclub.it/entry/{club_id}/{nfc_uid}` |

## Publish to GitHub

This repository is not yet initialized as a git repo. Run these commands from the project root:

```bash
cd /path/to/club-crm

# 1. Initialize git (skip if already a repo)
git init

# 2. Verify secrets are NOT staged
git status
# backend/.env, frontend/.env, vendor/, node_modules/, dist/ must NOT appear

# 3. Stage and commit
git add .
git commit -m "Initial commit: Club CRM"

# 4. Create repo on GitHub (browser or gh CLI), then:
git branch -M main
git remote add origin https://github.com/YOUR_USER/club-crm.git
git push -u origin main
```

Replace `YOUR_USER` with your GitHub username or organization.

### Secret scan before first commit

```bash
# Should return nothing outside vendor/node_modules:
grep -r "APP_KEY=base64:" --include="*.env" --exclude-dir=vendor --exclude-dir=node_modules .
grep -r "CANOPYWAVE_API_KEY=" --include="*.php" --include="*.ts" --exclude-dir=vendor --exclude-dir=node_modules . | grep -v example
```

Only `.env.example` and `.env.production.example` should contain placeholder keys — never real values.

## NFC production URL format

```
https://club.backclub.it/entry/{club_id}/{nfc_uid}
```

Example: `https://club.backclub.it/entry/1/NFC-OWNER-001`
