# Deploying Club CRM on Hostinger — club.backclub.it

Production guide for **Club CRM** on Hostinger shared hosting.

## Architecture (chosen)

| Host | Purpose | Document root |
|------|---------|---------------|
| `https://club.backclub.it` | React SPA (static `frontend/dist/`) | `domains/club.backclub.it/public_html/` |
| `https://api.club.backclub.it` | Laravel 13 API (`/api/*` routes) | `backend/public/` |

**Why a subdomain for the API?** On Hostinger shared hosting, separate subdomains are simpler than mixing SPA fallback and Laravel routing on one domain. Each host has its own document root, standard `.htaccess` rules, and independent SSL. CORS is explicit and predictable.

Alternative same-domain `/api` routing is documented in [docs/hostinger/same-domain-root.htaccess](hostinger/same-domain-root.htaccess) but **not recommended** for this project.

```
Browser → club.backclub.it (SPA)
              ↓ API calls
         api.club.backclub.it/api/...
              ↓
         Laravel backend/public/index.php
```

## 1. DNS (Hostinger hPanel)

In **Domains → DNS / Nameservers** for `backclub.it`:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `club` | Hostinger server IP | 14400 |
| A | `api.club` | Same server IP | 14400 |

Or create both as **subdomains** in hPanel (Hostinger adds DNS automatically).

Wait for propagation (minutes to a few hours). Enable **Free SSL** for both hostnames.

## 2. MySQL database

1. hPanel → **Databases → MySQL Databases**
2. Create database: e.g. `club_backclub`
3. Create user: e.g. `club_backclub_user` with a strong password
4. Assign user to database (ALL PRIVILEGES)
5. Note: host is usually `localhost`

## 3. Server folder layout

Recommended structure on the Hostinger account:

```
/home/your_user/
├── club-crm-backend/              # Laravel app (NOT web-accessible)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/                    # ← document root for api.club.backclub.it
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   └── .env                       # secrets — never in public_html
│
└── domains/
    └── club.backclub.it/
        └── public_html/           # ← SPA (frontend/dist/ contents)
            ├── index.html
            ├── assets/
            └── .htaccess          # from docs/hostinger/spa-root.htaccess
```

Upload `backend/` via SFTP/Git deploy. Point `api.club.backclub.it` document root to `club-crm-backend/public`.

## 4. Backend setup

SSH or Hostinger terminal:

```bash
cd ~/club-crm-backend
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
APP_URL=https://api.club.backclub.it

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

### API `.htaccess`

`backend/public/.htaccess` is included in the repo. If missing on the server, copy [docs/hostinger/laravel-public.htaccess](hostinger/laravel-public.htaccess).

## 5. Cron jobs

Laravel scheduler + database queue worker (defined in `backend/routes/console.php`):

```cron
* * * * * cd /home/your_user/club-crm-backend && php artisan schedule:run >> /dev/null 2>&1
```

Replace `/home/your_user/club-crm-backend` with your actual path. The scheduler runs `queue:work database --stop-when-empty --max-time=55` every minute — suitable for shared hosting without a persistent daemon.

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
VITE_API_URL=https://api.club.backclub.it/api
```

Upload **contents** of `frontend/dist/` to `domains/club.backclub.it/public_html/`.

Copy [docs/hostinger/spa-root.htaccess](hostinger/spa-root.htaccess) to `public_html/.htaccess` for React Router client-side routing.

See [docs/hostinger/README.md](hostinger/README.md) for file placement details.

## 7. CORS and HTTPS

- Backend `config/cors.php` reads `CORS_ALLOWED_ORIGINS` — must include `https://club.backclub.it`
- Both hosts must use HTTPS (Hostinger Free SSL)
- `FRONTEND_URL` documents the SPA origin; it is not used for routing

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
curl -s https://api.club.backclub.it/up

# Entry endpoint (no auth)
curl -s https://api.club.backclub.it/api/entry/1/NFC-OWNER-001

# SPA loads
curl -sI https://club.backclub.it | head -5
```

Browser checks:

- [ ] SPA loads at `https://club.backclub.it`
- [ ] NFC entry URL opens PIN screen
- [ ] Login succeeds (CORS working)
- [ ] Admin dashboard reachable for owner card
- [ ] Cron active in hPanel

Full checklist: [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)

## 10. Security notes

- Keep `APP_DEBUG=false` in production
- Never commit `.env` — only `.env.example` and `.env.production.example`
- Block web access to `backend/.env`, `backend/storage`, and everything above `public/`
- Rotate `APP_KEY` and database passwords if ever exposed
- Use Hostinger **IP deny** or file permissions to protect sensitive paths

## Related docs

- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — ordered deploy-day checklist
- [hostinger/README.md](hostinger/README.md) — Apache `.htaccess` placement
- [CANOPYWAVE_SETUP.md](CANOPYWAVE_SETUP.md) — AI integration keys
