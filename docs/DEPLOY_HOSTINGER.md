# Deploying Club CRM on Hostinger — club.backclub.it

Production guide for **Club CRM** on Hostinger shared hosting with a **single domain** layout.

## Architecture

| URL | Purpose | Server path |
|-----|---------|-------------|
| `https://club.backclub.it` | React SPA (static `frontend/dist/`) | `domains/club.backclub.it/public_html/` |
| `https://club.backclub.it/api` | Laravel 13 API | `public_html/api/index.php` → `domains/club.backclub.it/api/` |

**No `api.club.backclub.it` subdomain.** Hostinger shared hosting uses a fixed `public_html` document root — the Laravel app lives outside it at `domains/club.backclub.it/api/`, with only `index.php` + `.htaccess` exposed under `public_html/api/`.

```
Browser → club.backclub.it (SPA)
              ↓ API calls (same origin)
         club.backclub.it/api/entry/...
              ↓
         public_html/api/index.php → ../../api/ (Laravel)
```

## 1. DNS (Hostinger hPanel)

In **Domains → DNS / Nameservers** for `backclub.it`:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `club` | Hostinger server IP | 14400 |

Or create `club.backclub.it` as a subdomain in hPanel (DNS added automatically).

Wait for propagation. Enable **Free SSL** for `club.backclub.it`.

## 2. MySQL database

1. hPanel → **Databases → MySQL Databases**
2. Create database: e.g. `club_backclub`
3. Create user: e.g. `club_backclub_user` with a strong password
4. Assign user to database (ALL PRIVILEGES)
5. Note: host is usually `localhost`

## 3. Server folder layout

```
/home/your_user/domains/club.backclub.it/
├── public_html/                   ← document root (cannot be changed)
│   ├── index.html                 ← SPA
│   ├── assets/
│   ├── .htaccess                  ← from docs/hostinger/public_html.htaccess
│   └── api/
│       ├── index.php                ← from docs/hostinger/laravel-public-index.php
│       └── .htaccess                ← from docs/hostinger/laravel-public.htaccess
│
└── api/                           ← Laravel app (NOT web-accessible)
    ├── app/, bootstrap/, config/
    ├── storage/, vendor/
    └── .env                       ← secrets — never in public_html
```

Run [`scripts/hostinger-first-setup.sh`](../scripts/hostinger-first-setup.sh) once via SSH, or follow the manual steps below.

## 4. Backend setup

SSH or Hostinger terminal:

```bash
cd ~/domains/club.backclub.it/api
composer install --no-dev --optimize-autoloader
cp .env.production.example .env
php artisan key:generate
```

### Production `.env` values

Use [backend/.env.production.example](../backend/.env.production.example) as the template:

```dotenv
APP_NAME="Club CRM"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://club.backclub.it

# Empty — Laravel is mounted at public_html/api/, URL path /api is the folder not a route prefix
API_ROUTE_PREFIX=

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=club_backclub
DB_USERNAME=club_backclub_user
DB_PASSWORD=your_database_password_here

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

FRONTEND_URL=https://club.backclub.it
CORS_ALLOWED_ORIGINS=https://club.backclub.it

JWT_SECRET=
JWT_TTL=7200

CANOPYWAVE_ENABLED=true
CANOPYWAVE_BASE_URL=https://inference.canopywave.io/v1
CANOPYWAVE_API_KEY=your_canopywave_subscription_key_here
CANOPYWAVE_MODEL=moonshotai/kimi-k2.6
CANOPYWAVE_TEMPERATURE=0.6
CANOPYWAVE_TIMEOUT=3
CANOPYWAVE_MAX_TOKENS=512
```

`JWT_SECRET` can stay empty — it defaults to `APP_KEY`. Set `CANOPYWAVE_API_KEY` only after subscribing; see [CANOPYWAVE_SETUP.md](CANOPYWAVE_SETUP.md).

### Migrations, storage, cache

```bash
php artisan migrate --force
php artisan storage:link
chmod -R 775 storage bootstrap/cache
php artisan config:cache
php artisan route:cache
```

Ensure `storage/` and `bootstrap/cache/` are writable by the web server user.

### API entry files

Copy deploy templates to the server (done automatically by `deploy.sh` / GitHub Actions):

| Template | Server path |
|----------|-------------|
| `docs/hostinger/laravel-public-index.php` | `public_html/api/index.php` |
| `docs/hostinger/laravel-public.htaccess` | `public_html/api/.htaccess` |
| `docs/hostinger/public_html.htaccess` | `public_html/.htaccess` |

## 5. Cron jobs

Laravel scheduler + database queue worker (defined in `backend/routes/console.php`):

```cron
* * * * * cd /home/your_user/domains/club.backclub.it/api && php artisan schedule:run >> /dev/null 2>&1
```

Replace the path with your actual `HOSTINGER_LARAVEL_PATH`.

## 6. Frontend (static SPA)

On your **build machine** (not necessarily the server):

```bash
cd frontend
npm ci
cp .env.production.example .env.production
npm run build
```

`frontend/.env.production` must contain:

```dotenv
VITE_API_URL=https://club.backclub.it/api
```

Upload **contents** of `frontend/dist/` to `domains/club.backclub.it/public_html/`.

Copy [docs/hostinger/public_html.htaccess](hostinger/public_html.htaccess) to `public_html/.htaccess` for React Router client-side routing and `/api` pass-through.

See [docs/hostinger/README.md](hostinger/README.md) for file placement details.

## 7. CORS and HTTPS

- SPA and API share origin `https://club.backclub.it` — CORS is less critical but `CORS_ALLOWED_ORIGINS` is still set
- `FRONTEND_URL` documents the SPA origin
- Force HTTPS via Hostinger Free SSL

## 8. NFC card URLs

Program NFC tags with:

```
https://club.backclub.it/entry/{club_id}/{nfc_uid}
```

Examples (after seeding club `id = 1`):

- Owner: `https://club.backclub.it/entry/1/NFC-OWNER-001`
- Member: `https://club.backclub.it/entry/1/NFC-MEMBER-001`

## 9. Post-deploy verification

```bash
# API health
curl -s https://club.backclub.it/api/up

# Entry endpoint (no auth)
curl -s https://club.backclub.it/api/entry/1/NFC-OWNER-001

# SPA loads
curl -sI https://club.backclub.it | head -5
```

Browser checks:

- [ ] SPA loads at `https://club.backclub.it`
- [ ] NFC entry URL opens PIN screen
- [ ] Login succeeds
- [ ] Admin dashboard reachable for owner card
- [ ] Cron active in hPanel

Full checklist: [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)

## 10. Security notes

- Keep `APP_DEBUG=false` in production
- Never commit `.env` — only `.env.example` and `.env.production.example`
- Never place `.env`, `vendor/`, or `storage/` inside `public_html`
- `public_html/api/` contains **only** `index.php` and `.htaccess`
- Rotate `APP_KEY` and database passwords if ever exposed

## Related docs

- [HOSTINGER_STRUCTURE.md](HOSTINGER_STRUCTURE.md) — folder layout, routing fix, diagrams
- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — ordered deploy-day checklist
- [`scripts/deploy.sh`](../scripts/deploy.sh) — local deploy with SSH commands
- [`scripts/hostinger-first-setup.sh`](../scripts/hostinger-first-setup.sh) — initial server setup
- [hostinger/README.md](hostinger/README.md) — Apache `.htaccess` placement
- [CANOPYWAVE_SETUP.md](CANOPYWAVE_SETUP.md) — AI integration keys
