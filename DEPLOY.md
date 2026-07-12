# DEPLOY — Club CRM su Hostinger

Guida rapida e schematica per **setup iniziale** e **aggiornamenti** su `club.backclub.it`.

| URL | Cosa serve |
|-----|------------|
| `https://club.backclub.it` | Frontend SPA (React) |
| `https://club.backclub.it/api` | API Laravel |
| `https://club.backclub.it/entry/{club_id}/{nfc_uid}` | URL tag NFC |

Repo: [github.com/BackSoftwareJR/club-backclub](https://github.com/BackSoftwareJR/club-backclub)

---

## 1. Struttura cartelle (Hostinger)

```
/home/TUO_USER/domains/club.backclub.it/
│
├── public_html/              ← DOCUMENT ROOT (solo file web)
│   ├── index.html            ← SPA buildata
│   ├── assets/
│   ├── .htaccess             ← routing SPA + pass-through /api
│   └── api/                  ← SOLO entry point Laravel
│       ├── index.php
│       └── .htaccess
│
└── api/                        ← Laravel COMPLETO (NON web-accessible)
    ├── app/, config/, routes/
    ├── storage/, vendor/
    ├── artisan
    └── .env                    ← MAI in public_html
```

**Regola d'oro:** `.env`, `vendor/`, `storage/` restano in `api/` — **mai** in `public_html`.

---

## 2. Placeholder da sostituire

| Placeholder | Dove trovarlo |
|-------------|---------------|
| `TUO_USER` | hPanel → Hosting → SSH Access |
| `ssh.hostinger.com` | hPanel → SSH (o IP server) |
| `DB_*` | hPanel → Databases → MySQL |
| `CANOPYWAVE_API_KEY` | Dashboard Canopywave (Monthly Subscription) |

---

## 3. SETUP INIZIALE (una volta sola)

### 3.1 hPanel — prima di SSH

- [ ] Dominio `club.backclub.it` attivo
- [ ] **SSL** attivo (Free SSL)
- [ ] **Database MySQL** creato → annota `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- [ ] **SSH** abilitato

### 3.2 Clone repo sul server

```bash
ssh TUO_USER@ssh.hostinger.com

mkdir -p ~/domains/club.backclub.it/api
mkdir -p ~/domains/club.backclub.it/public_html/api

cd ~
git clone https://github.com/BackSoftwareJR/club-backclub.git club-crm-tmp
```

### 3.3 Backend Laravel → cartella `api/` (fuori public_html)

```bash
rsync -a --exclude '.env' --exclude 'vendor/' --exclude 'public/' \
  ~/club-crm-tmp/backend/ ~/domains/club.backclub.it/api/

cd ~/domains/club.backclub.it/api
composer install --no-dev --optimize-autoloader
cp .env.production.example .env
php artisan key:generate
nano .env   # ← compila DB_*, CANOPYWAVE_API_KEY (vedi sezione 4)
php artisan migrate --force
php artisan storage:link
chmod -R 775 storage bootstrap/cache
php artisan config:cache
php artisan route:cache
```

### 3.4 Entry point API + .htaccess in public_html

```bash
cp ~/club-crm-tmp/docs/hostinger/laravel-public-index.php \
   ~/domains/club.backclub.it/public_html/api/index.php

cp ~/club-crm-tmp/docs/hostinger/laravel-public.htaccess \
   ~/domains/club.backclub.it/public_html/api/.htaccess

cp ~/club-crm-tmp/docs/hostinger/public_html.htaccess \
   ~/domains/club.backclub.it/public_html/.htaccess
```

### 3.5 Frontend SPA → public_html (dal tuo Mac)

```bash
cd /path/to/club-crm/frontend
cp .env.production.example .env.production
npm install
npm run build

rsync -avz --delete dist/ TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/public_html/
```

> **Attenzione:** rsync `--delete` sovrascrive `public_html/` ma **non** rimuove `public_html/api/` se esiste già.

### 3.6 Cron (hPanel → Cron Jobs)

```bash
* * * * * cd /home/TUO_USER/domains/club.backclub.it/api && php artisan schedule:run >> /dev/null 2>&1
```

### 3.7 Verifica setup

```bash
curl -s https://club.backclub.it/api/up
curl -s https://club.backclub.it/api/entry/1/NFC-OWNER-001
curl -sI https://club.backclub.it | head -3
```

Apri browser: `https://club.backclub.it/entry/1/NFC-OWNER-001` (PIN demo owner: `123456` dopo seed).

### 3.8 Pulizia (opzionale)

```bash
rm -rf ~/club-crm-tmp
```

---

## 4. Variabili `.env` produzione

File: `~/domains/club.backclub.it/api/.env`

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://club.backclub.it

# Hostinger: vuoto — le route sono /entry/... (Apache passa il path senza prefisso /api)
API_ROUTE_PREFIX=

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

FRONTEND_URL=https://club.backclub.it
CORS_ALLOWED_ORIGINS=https://club.backclub.it

CANOPYWAVE_ENABLED=true
CANOPYWAVE_API_KEY=          # chiave Monthly Subscription
CANOPYWAVE_MODEL=moonshotai/kimi-k2.6
CANOPYWAVE_TIMEOUT=3
```

Frontend build (`.env.production` locale):

```dotenv
VITE_API_URL=https://club.backclub.it/api
```

Dopo ogni modifica `.env` sul server:

```bash
cd ~/domains/club.backclub.it/api && php artisan config:cache
```

---

## 5. DEPLOY AGGIORNAMENTI (flusso standard)

### 5.1 Configura script locale (una volta)

```bash
cp scripts/deploy.config.example scripts/deploy.config
nano scripts/deploy.config   # compila TUO_USER e path
chmod +x scripts/deploy.sh
```

### 5.2 Ogni release — dal Mac

```bash
./scripts/deploy.sh
```

Lo script esegue in automatico:
1. `php artisan test` (backend)
2. `npm run build` (frontend produzione)
3. Commit + push GitHub (con conferma)
4. Stampa comandi SSH/rsync **copy-paste**

Poi esegui i blocchi che ti servono (vedi sotto).

---

## 6. Comandi rapidi — cosa copiare quando

### A) Solo FRONTEND (UI cambiata)

**Mac:**
```bash
cd frontend && npm run build
rsync -avz --delete dist/ TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/public_html/
```

> Non tocca `public_html/api/`.

---

### B) Solo BACKEND (logica API, no migrazioni)

**Mac → rsync codice:**
```bash
rsync -avz --delete \
  --exclude '.env' --exclude '.env.*' \
  --exclude 'storage/logs/' \
  --exclude 'public/' \
  backend/ TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/api/
```

**SSH → post-deploy:**
```bash
ssh TUO_USER@ssh.hostinger.com
cd ~/domains/club.backclub.it/api
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
```

---

### C) BACKEND + MIGRAZIONI DB

**Mac → rsync** (come sopra, sezione B)

**SSH → migrate:**
```bash
ssh TUO_USER@ssh.hostinger.com "cd ~/domains/club.backclub.it/api && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan config:cache && php artisan route:cache"
```

---

### D) Solo MIGRAZIONI (nessun codice cambiato)

```bash
ssh TUO_USER@ssh.hostinger.com "cd ~/domains/club.backclub.it/api && php artisan migrate --force"
```

---

### E) Aggiornato entry point Laravel (raro)

Solo se cambiano `docs/hostinger/laravel-public-index.php` o `.htaccess`:

```bash
scp docs/hostinger/laravel-public-index.php \
  TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/public_html/api/index.php

scp docs/hostinger/laravel-public.htaccess \
  TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/public_html/api/.htaccess

scp docs/hostinger/public_html.htaccess \
  TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/public_html/.htaccess
```

---

### F) DEPLOY COMPLETO (frontend + backend + migrate)

```bash
# 1. Locale
./scripts/deploy.sh

# 2. Backend
rsync -avz --delete --exclude '.env' --exclude '.env.*' --exclude 'storage/logs/' --exclude 'public/' \
  backend/ TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/api/

# 3. Post-deploy SSH
ssh TUO_USER@ssh.hostinger.com "cd ~/domains/club.backclub.it/api && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan config:cache && php artisan route:cache"

# 4. Frontend
rsync -avz --delete frontend/dist/ TUO_USER@ssh.hostinger.com:~/domains/club.backclub.it/public_html/

# 5. Verifica
curl -s https://club.backclub.it/api/up
```

---

## 7. Tabella decisionale rapida

| Cosa hai cambiato? | Comandi |
|--------------------|---------|
| Solo React/UI | **A** |
| PHP/API, nessuna migration | **B** |
| PHP/API + nuove tabelle/colonne | **C** |
| Solo migration già deployata | **D** |
| `.htaccess` / `index.php` API | **E** |
| Release completa | **F** o `./scripts/deploy.sh` + blocchi stampati |

---

## 8. Sicurezza — cosa NON pubblicare

| File/cartella | Motivo |
|---------------|--------|
| `.env` | Password DB, APP_KEY, JWT, Canopywave |
| `scripts/deploy.config` | Credenziali SSH personali |
| `backend/vendor/` | Si rigenera con `composer install` |
| `frontend/node_modules/` | Si rigenera con `npm install` |
| `frontend/dist/` | Si builda, non va su GitHub |

Tutti già in `.gitignore`. **Mai** committare `.env` reali.

---

## 9. GitHub Actions (opzionale)

Push su `main` → CI esegue test + build automaticamente.

**Auto-deploy SSH** (opzionale): GitHub → Settings → Secrets → Actions:

| Secret | Valore |
|--------|--------|
| `HOSTINGER_SSH_HOST` | `ssh.hostinger.com` |
| `HOSTINGER_SSH_USER` | `u123456789` |
| `HOSTINGER_SSH_KEY` | chiave privata PEM |
| `HOSTINGER_LARAVEL_PATH` | `/home/.../domains/club.backclub.it/api` |
| `HOSTINGER_PUBLIC_HTML` | `/home/.../domains/club.backclub.it/public_html` |

Senza secret: usa `./scripts/deploy.sh` + rsync manuale.

---

## 10. Troubleshooting rapido

| Problema | Fix |
|----------|-----|
| 404 su `/api/*` | Verifica `public_html/api/index.php` e `.htaccess` |
| 404 su route SPA | Verifica `public_html/.htaccess` (fallback index.html) |
| 500 API | `tail ~/domains/club.backclub.it/api/storage/logs/laravel.log` |
| `/api/entry` 404 ma `/api/up` OK | `.env` → `API_ROUTE_PREFIX=` (vuoto), aggiorna `bootstrap/app.php` dal repo, `index.php` senza strip URI, poi `route:clear` + `config:clear` + `route:cache`. `route:list` deve mostrare `entry/{club_id}` non `api/entry` |
| CORS error | `FRONTEND_URL` e `CORS_ALLOWED_ORIGINS` = `https://club.backclub.it` |
| Permessi storage | `chmod -R 775 storage bootstrap/cache` |
| Queue non parte | Verifica cron scheduler (sezione 3.6) |

---

## 11. Documenti correlati

| File | Contenuto |
|------|-----------|
| [docs/HOSTINGER_STRUCTURE.md](docs/HOSTINGER_STRUCTURE.md) | Architettura dettagliata |
| [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md) | Checklist giorno deploy |
| [docs/CANOPYWAVE_SETUP.md](docs/CANOPYWAVE_SETUP.md) | Setup AI Kimi K2.6 |
| [scripts/deploy.sh](scripts/deploy.sh) | Script deploy locale |
| [scripts/hostinger-first-setup.sh](scripts/hostinger-first-setup.sh) | Setup automatico server |

---

*Ultimo aggiornamento: dominio singolo `club.backclub.it`, API su `/api`, Laravel root in `domains/club.backclub.it/api/`.*
