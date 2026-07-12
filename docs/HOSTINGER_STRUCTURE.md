# Struttura Hostinger — Club CRM (dominio singolo)

Guida alla disposizione file su **Hostinger shared hosting** per:

| URL | Ruolo |
|-----|-------|
| `https://club.backclub.it` | SPA React (build statico) |
| `https://club.backclub.it/api` | API Laravel 13 |

**Nessun sottodominio** `api.club.backclub.it`. Tutto sotto `club.backclub.it`.

Repository: [BackSoftwareJR/club-backclub](https://github.com/BackSoftwareJR/club-backclub)

---

## Albero cartelle su Hostinger

```
/home/uXXXXX/domains/club.backclub.it/
│
├── public_html/                         ← DOCUMENT ROOT (unica cartella web-accessible)
│   ├── index.html                       ← React SPA (frontend/dist/)
│   ├── assets/                          ← bundle JS/CSS
│   ├── .htaccess                        ← SPA fallback + pass-through /api
│   ├── storage → ../../api/storage/app/public   ← symlink immagini upload
│   └── api/                             ← SOLO entry point Laravel (public/)
│       ├── index.php                    ← bootstrap da ../../api/
│       └── .htaccess                    ← rewrite Laravel standard
│
└── api/                                 ← Laravel app root FUORI public_html
    ├── app/, bootstrap/, config/, routes/
    ├── storage/, vendor/
    ├── artisan
    └── .env                             ← SEGRETI — mai in public_html
```

### Perché questa struttura

| Vincolo Hostinger | Soluzione |
|-------------------|-----------|
| `public_html` è document root e **non si può cambiare** | SPA + `public_html/api/index.php` dentro `public_html` |
| File sensibili fuori dal web root | Laravel completo in `domains/club.backclub.it/api/` |
| API su `/api` senza sottodominio | `API_ROUTE_PREFIX=` (vuoto) + `index.php` che rimuove il prefisso URL `/api` |

---

## Flusso richiesta HTTP

```
Browser
   │
   ├─ GET /entry/1/NFC-OWNER-001     → public_html/.htaccess → index.html (SPA)
   │
   └─ GET /api/entry/1/NFC-OWNER-001 → public_html/api/.htaccess → index.php
                                            │
                                            ▼
                                     strip /api prefix
                                            │
                                            ▼
                              Laravel route: /entry/{club_id}/{nfc_uid}
                              (API_ROUTE_PREFIX vuoto in produzione)
```

### Routing fix (no doppio `/api/api/`)

In sviluppo locale, Laravel usa il prefisso route predefinito `api` → `http://localhost:8000/api/entry/...`.

In produzione Hostinger, la cartella fisica **è già** `/api/`. Se Laravel aggiungesse anche il prefisso route `api`, l'URL diventerebbe `/api/api/entry/...`.

**Soluzione:**

1. `API_ROUTE_PREFIX=` (vuoto) nel `.env` di produzione
2. `public_html/api/index.php` rimuove `/api` dall'URI prima del bootstrap Laravel
3. Frontend: `VITE_API_URL=https://club.backclub.it/api` — axios chiama `/entry/...` → URL completo `club.backclub.it/api/entry/...`

### Immagini upload (cover prodotti, logo club)

Laravel salva in `api/storage/app/public/`. L'URL generato è `https://club.backclub.it/storage/...`.

Su Hostinger crea **una tantum** il symlink web:

```bash
ln -sfn ~/domains/club.backclub.it/api/storage/app/public \
  ~/domains/club.backclub.it/public_html/storage
chmod -R 775 ~/domains/club.backclub.it/api/storage
```

Nei deploy frontend con `rsync --delete` proteggi `storage/` (`--filter 'protect storage/'`) altrimenti il symlink viene rimosso.

---

## Perché `.env` e `vendor/` restano fuori da `public_html`

```
                    INTERNET
                        │
                        ▼
              ┌─────────────────────┐
              │   public_html       │  ← solo SPA + api/index.php
              │   (document root)   │
              └──────────┬──────────┘
                         │
              public_html/api/index.php
                         │
                         ▼
              ┌──────────────────────┐
              │  domains/.../api/    │  ← NON raggiungibile via URL diretto
              │  .env, vendor,         │
              │  storage, config     │
              └──────────────────────┘
```

| File/cartella | Perché NON in `public_html` |
|---------------|----------------------------|
| `.env` | Password DB, `APP_KEY`, chiavi JWT e Canopywave |
| `vendor/` | Codice Composer; esporlo aumenta superficie d'attacco |
| `storage/` | Log, cache, upload utenti |
| `config/`, `app/`, `routes/` | Logica applicativa |

---

## SSL (HTTPS)

1. hPanel → **SSL** → attiva **Free SSL** per `club.backclub.it`
2. Forza HTTPS (toggle hPanel o regole `.htaccess`)
3. Verifica:

```bash
curl -sI https://club.backclub.it | head -3
curl -s https://club.backclub.it/api/up
```

---

## Variabili ambiente produzione

### Backend (`domains/club.backclub.it/api/.env`)

```dotenv
APP_URL=https://club.backclub.it
API_ROUTE_PREFIX=

FRONTEND_URL=https://club.backclub.it
CORS_ALLOWED_ORIGINS=https://club.backclub.it
```

SPA e API sono **same-origin** (`club.backclub.it`) — CORS è meno critico ma `FRONTEND_URL` resta documentato.

### Frontend (`frontend/.env.production` prima del build)

```dotenv
VITE_API_URL=https://club.backclub.it/api
```

Dopo ogni modifica al `.env` sul server:

```bash
cd ~/domains/club.backclub.it/api && php artisan config:cache
```

---

## URL NFC (produzione)

```
https://club.backclub.it/entry/{club_id}/{nfc_uid}
```

| Ruolo | URL |
|-------|-----|
| Owner | `https://club.backclub.it/entry/1/NFC-OWNER-001` |
| Member | `https://club.backclub.it/entry/1/NFC-MEMBER-001` |

La SPA gestisce il routing client-side; l'API risponde su `https://club.backclub.it/api/entry/...`.

---

## Credenziali database (`.env` sul server)

**Non committare mai** il `.env` di produzione. Sul server, una tantum:

```bash
cd ~/domains/club.backclub.it/api
cp .env.production.example .env
php artisan key:generate
# Modifica DB_* con le credenziali MySQL create in hPanel
nano .env
php artisan migrate --force
```

Template completo: [`backend/.env.production.example`](../backend/.env.production.example)

---

## Flusso deploy (riepilogo)

```
Locale / GitHub Actions          Hostinger
─────────────────────           ─────────
php artisan test (CI)           rsync backend/ → domains/.../api/
npm run build                   rsync dist/ → public_html/
                                scp index.php + .htaccess → public_html/api/
                                scp public_html.htaccess → public_html/
                                composer install --no-dev
                                php artisan migrate --force
                                php artisan config:cache
```

Script locali: [`../scripts/deploy.sh`](../scripts/deploy.sh)  
CI/CD: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

---

## File Apache (docs/hostinger/)

| File | Destinazione su server |
|------|------------------------|
| [`public_html.htaccess`](hostinger/public_html.htaccess) | `public_html/.htaccess` |
| [`laravel-public-index.php`](hostinger/laravel-public-index.php) | `public_html/api/index.php` |
| [`laravel-public.htaccess`](hostinger/laravel-public.htaccess) | `public_html/api/.htaccess` |

---

## Documenti correlati

- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — checklist giorno del deploy
- [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md) — guida operativa estesa
- [hostinger/README.md](hostinger/README.md) — file `.htaccess`
- [`scripts/hostinger-first-setup.sh`](../scripts/hostinger-first-setup.sh) — setup iniziale server
