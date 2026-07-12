# Hostinger Apache config snippets

Club CRM production uses a **single domain** on Hostinger shared hosting:

| URL | Server path | Config file |
|-----|-------------|-------------|
| `https://club.backclub.it` | SPA (`frontend/dist/`) | [`public_html.htaccess`](public_html.htaccess) |
| `https://club.backclub.it/api` | Laravel entry (`public_html/api/`) | [`laravel-public-index.php`](laravel-public-index.php) + [`laravel-public.htaccess`](laravel-public.htaccess) |

Laravel app root (`app/`, `.env`, `vendor/`, `storage/`) lives at `domains/club.backclub.it/api/` — **outside** `public_html`.

## Where to place each file

### SPA root — `public_html/`

1. Build locally: `cd frontend && cp .env.production.example .env.production && npm run build`
2. Upload **contents** of `frontend/dist/` to `domains/club.backclub.it/public_html/`.
3. Copy `docs/hostinger/public_html.htaccess` to that folder as **`.htaccess`**.

This enables React Router client-side routes (`/entry/...`, `/club/...`, etc.) and passes `/api/*` through to the Laravel entry point.

### API entry — `public_html/api/`

1. Deploy Laravel app to `domains/club.backclub.it/api/` (outside `public_html`).
2. Copy `docs/hostinger/laravel-public-index.php` → `public_html/api/index.php`
3. Copy `docs/hostinger/laravel-public.htaccess` → `public_html/api/.htaccess`

Do **not** expose `api/.env`, `api/storage`, `api/vendor`, or any path above `public_html/api/index.php`.

### Legacy files (deprecated)

| File | Status |
|------|--------|
| [`spa-root.htaccess`](spa-root.htaccess) | Replaced by `public_html.htaccess` (no `/api` pass-through) |
| [`same-domain-root.htaccess`](same-domain-root.htaccess) | Replaced by `public_html.htaccess` |

## SSL

Enable **Free SSL** in Hostinger hPanel for `club.backclub.it`. Force HTTPS in hPanel or add redirect rules if needed.

## Routing note

Production `.env` sets `API_ROUTE_PREFIX=` (empty). The `index.php` template strips the `/api` URL prefix before Laravel routing, so external URLs like `club.backclub.it/api/entry/...` map to internal route `/entry/...` without a double `/api/api/` prefix.

See [HOSTINGER_STRUCTURE.md](../HOSTINGER_STRUCTURE.md) for the full explanation.
