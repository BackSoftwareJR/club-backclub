# Hostinger Apache config snippets

Club CRM production uses **two subdomains** on the same Hostinger account:

| Subdomain | Document root | Config file from this folder |
|-----------|---------------|------------------------------|
| `club.backclub.it` | SPA static files (`frontend/dist/`) | [`spa-root.htaccess`](spa-root.htaccess) |
| `api.club.backclub.it` | Laravel `backend/public/` | Use Laravel default — [`laravel-public.htaccess`](laravel-public.htaccess) |

## Where to place each file

### SPA — `club.backclub.it`

1. Build locally: `cd frontend && cp .env.production.example .env.production && npm run build`
2. Upload **contents** of `frontend/dist/` to the subdomain document root (e.g. `domains/club.backclub.it/public_html/`).
3. Copy `docs/hostinger/spa-root.htaccess` to that folder as **`.htaccess`**.

This enables React Router client-side routes (`/entry/...`, `/club/...`, etc.).

### API — `api.club.backclub.it`

1. Upload the full `backend/` tree **outside** `public_html` when possible (e.g. `~/club-crm-backend/`).
2. In hPanel → **Domains** → `api.club.backclub.it` → set document root to `backend/public/`.
3. Laravel ships `backend/public/.htaccess`; replace only if missing. The copy in `laravel-public.htaccess` matches the default.

Do **not** expose `backend/storage`, `backend/.env`, or any path above `public/`.

### Same-domain alternative (not used in production)

If you ever serve API and SPA from `club.backclub.it` (SPA at `/`, API at `/api`), use [`same-domain-root.htaccess`](same-domain-root.htaccess) at the combined document root and point Laravel to a subdirectory. The recommended setup avoids this complexity — see [DEPLOY_HOSTINGER.md](../DEPLOY_HOSTINGER.md).

## SSL

Enable **Free SSL** in Hostinger hPanel for both `club.backclub.it` and `api.club.backclub.it`. Force HTTPS in hPanel or add redirect rules if needed.
