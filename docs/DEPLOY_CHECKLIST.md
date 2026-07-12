# Club CRM — deploy-day checklist (club.backclub.it)

Use this list in order on deploy day. Check each item before going live.

## Pre-deploy (local / GitHub)

- [ ] `cd backend && php artisan test` — all green
- [ ] `cd frontend && npm run build` — succeeds
- [ ] No secrets in tracked files (only `.env.example` / `.env.production.example`)
- [ ] Code pushed to GitHub (see [README.md](../README.md#publish-to-github))

## DNS & SSL

- [ ] A record: `club.backclub.it` → Hostinger server IP
- [ ] A record: `api.club.backclub.it` → same server IP
- [ ] DNS propagated (`dig club.backclub.it`, `dig api.club.backclub.it`)
- [ ] Free SSL enabled for `club.backclub.it`
- [ ] Free SSL enabled for `api.club.backclub.it`
- [ ] HTTPS redirect active (hPanel or `.htaccess`)

## MySQL

- [ ] Database created (e.g. `club_backclub`)
- [ ] User created with strong password
- [ ] User granted ALL PRIVILEGES on database
- [ ] Credentials noted securely (password manager)

## Backend (`api.club.backclub.it`)

- [ ] `backend/` uploaded outside `public_html` (e.g. `~/club-crm-backend/`)
- [ ] Subdomain document root → `club-crm-backend/public`
- [ ] `composer install --no-dev --optimize-autoloader`
- [ ] `cp .env.production.example .env`
- [ ] `php artisan key:generate`
- [ ] `.env` values set:
  - [ ] `APP_URL=https://api.club.backclub.it`
  - [ ] `APP_ENV=production`, `APP_DEBUG=false`
  - [ ] `DB_*` credentials
  - [ ] `FRONTEND_URL=https://club.backclub.it`
  - [ ] `CORS_ALLOWED_ORIGINS=https://club.backclub.it`
  - [ ] `CANOPYWAVE_API_KEY` (if AI enabled)
- [ ] `php artisan migrate --force`
- [ ] `php artisan storage:link`
- [ ] `storage/` and `bootstrap/cache/` writable (775)
- [ ] `php artisan config:cache` and `php artisan route:cache`
- [ ] `GET https://api.club.backclub.it/up` returns healthy
- [ ] `GET https://api.club.backclub.it/api/entry/1/NFC-OWNER-001` returns JSON

## Cron

- [ ] Cron entry added (every minute):
  ```cron
  * * * * * cd /path/to/club-crm-backend && php artisan schedule:run >> /dev/null 2>&1
  ```
- [ ] Path in cron matches actual backend directory

## Frontend (`club.backclub.it`)

- [ ] `cp frontend/.env.production.example frontend/.env.production`
- [ ] `VITE_API_URL=https://api.club.backclub.it/api` confirmed
- [ ] `npm run build` completed
- [ ] `frontend/dist/*` uploaded to `club.backclub.it` document root
- [ ] `docs/hostinger/spa-root.htaccess` copied as `public_html/.htaccess`
- [ ] `https://club.backclub.it` loads in browser
- [ ] Deep link works: `https://club.backclub.it/entry/1/NFC-OWNER-001`

## Functional smoke test

- [ ] NFC entry URL opens club branding / PIN screen
- [ ] Owner login (`NFC-OWNER-001` / `123456` if seeded) succeeds
- [ ] Wallet balance visible
- [ ] Product list loads
- [ ] Admin dashboard accessible for owner
- [ ] CORS: no browser console errors on API calls
- [ ] AI endpoints respond (or silent fallback if `CANOPYWAVE_API_KEY` empty)

## NFC cards

- [ ] Tags programmed with `https://club.backclub.it/entry/{club_id}/{nfc_uid}`
- [ ] Test scan on a physical device

## Post-go-live

- [ ] `php artisan migrate:status` — all migrations ran
- [ ] Error logs monitored (`storage/logs/laravel.log`)
- [ ] Backup strategy for MySQL configured in hPanel
- [ ] Document production credentials in password manager (not in git)

## Rollback plan

- [ ] Previous `dist/` build archived locally
- [ ] Database backup taken before first `migrate --force`
- [ ] Know how to set maintenance mode if needed
