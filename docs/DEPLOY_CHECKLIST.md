# Club CRM — deploy-day checklist (club.backclub.it)

Checklist ordinata per il go-live e gli aggiornamenti successivi.

**Struttura server:** [HOSTINGER_STRUCTURE.md](HOSTINGER_STRUCTURE.md)  
**Deploy locale:** `./scripts/deploy.sh`  
**CI/CD GitHub:** [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

---

## Pre-deploy (locale)

- [ ] `./scripts/deploy.sh` oppure manualmente:
  - [ ] `cd backend && php artisan test` — tutti verdi
  - [ ] `cd frontend && npm run build` — build ok
- [ ] Nessun segreto nei file tracciati (solo `.env.example` / `.env.production.example`)
- [ ] `frontend/dist/` **non** committato (build al deploy via rsync)
- [ ] Codice pushato su GitHub (`main`)

### Config deploy locale (una tantum)

```bash
cp scripts/deploy.config.example scripts/deploy.config
# Modifica SSH user, host e path Hostinger
```

---

## DNS & SSL

- [ ] A record: `club.backclub.it` → IP server Hostinger
- [ ] A record: `api.club.backclub.it` → stesso IP
- [ ] DNS propagato (`dig club.backclub.it`, `dig api.club.backclub.it`)
- [ ] SSL gratuito attivo per entrambi i sottodomini
- [ ] Redirect HTTPS attivo (hPanel o `.htaccess`)

---

## MySQL

- [ ] Database creato (es. `club_backclub`)
- [ ] Utente con password forte
- [ ] Privilegi ALL sul database
- [ ] Credenziali salvate in password manager (non in git)

---

## Setup iniziale server (prima volta)

- [ ] SSH attivo su Hostinger
- [ ] Eseguito [`scripts/hostinger-first-setup.sh`](../scripts/hostinger-first-setup.sh) oppure passi manuali equivalenti
- [ ] Monorepo clonato in `~/club-crm`
- [ ] `.env` creato da `backend/.env.production.example` con credenziali DB reali
- [ ] `php artisan key:generate` eseguito
- [ ] Document root API → `~/club-crm/backend/public` **oppure** symlink/rsync su `api.../public_html`
- [ ] Cron scheduler configurato (vedi script setup)

---

## Backend (`api.club.backclub.it`)

- [ ] Laravel root in `~/club-crm/backend` (fuori da `public_html` del frontend)
- [ ] `.env` con:
  - [ ] `APP_URL=https://api.club.backclub.it`
  - [ ] `APP_ENV=production`, `APP_DEBUG=false`
  - [ ] `DB_*` credenziali Hostinger
  - [ ] `FRONTEND_URL=https://club.backclub.it`
  - [ ] `CORS_ALLOWED_ORIGINS=https://club.backclub.it`
  - [ ] `CANOPYWAVE_API_KEY` (se AI attiva)
- [ ] `composer install --no-dev --optimize-autoloader`
- [ ] `php artisan migrate --force`
- [ ] `php artisan storage:link`
- [ ] `storage/` e `bootstrap/cache/` scrivibili (775)
- [ ] `php artisan config:cache` e `php artisan route:cache`
- [ ] `GET https://api.club.backclub.it/up` — healthy
- [ ] `GET https://api.club.backclub.it/api/entry/1/NFC-OWNER-001` — JSON

---

## Aggiornamento backend (deploy successivi)

Copy-paste da `./scripts/deploy.sh` oppure:

```bash
ssh USER@HOST "cd ~/club-crm && git pull && cd ~/club-crm/backend && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan config:cache && php artisan route:cache"
```

---

## Frontend (`club.backclub.it`)

- [ ] `VITE_API_URL=https://api.club.backclub.it/api` in `.env.production`
- [ ] Build locale: `npm run build`
- [ ] Rsync `frontend/dist/` → `domains/club.backclub.it/public_html/`
- [ ] `docs/hostinger/spa-root.htaccess` come `public_html/.htaccess`
- [ ] `https://club.backclub.it` carica
- [ ] Deep link: `https://club.backclub.it/entry/1/NFC-OWNER-001`

### Aggiornamento frontend

```bash
rsync -avz --delete frontend/dist/ USER@HOST:~/domains/club.backclub.it/public_html/
```

---

## GitHub Actions (deploy automatico opzionale)

In **Settings → Secrets and variables → Actions**, aggiungi:

| Secret | Esempio |
|--------|---------|
| `HOSTINGER_SSH_HOST` | `ssh.hostinger.com` |
| `HOSTINGER_SSH_USER` | `u123456789` |
| `HOSTINGER_SSH_KEY` | chiave privata SSH (PEM) |
| `HOSTINGER_BACKEND_PATH` | `/home/u123456789/club-crm/backend` |
| `HOSTINGER_FRONTEND_PATH` | `/home/u123456789/domains/club.backclub.it/public_html` |
| `HOSTINGER_API_PUBLIC_PATH` | *(opzionale)* path `api.../public_html` |

Il job `deploy-ssh` parte automaticamente quando **tutti** i secret obbligatori sono impostati.  
Trigger: push su `main` (path `backend/`, `frontend/`) o **Run workflow** manuale.

Artifact CI (senza SSH): scaricabili da Actions → workflow **Deploy** → Artifacts.

---

## Smoke test funzionale

- [ ] URL NFC apre schermata PIN / branding club
- [ ] Login owner (`NFC-OWNER-001` / `123456` se seeded)
- [ ] Saldo wallet visibile
- [ ] Lista prodotti carica
- [ ] Dashboard admin accessibile
- [ ] Nessun errore CORS in console browser
- [ ] Endpoint AI rispondono (o fallback silenzioso)

---

## NFC

- [ ] Tag programmati: `https://club.backclub.it/entry/{club_id}/{nfc_uid}`
- [ ] Test scan su dispositivo fisico

---

## Post-go-live

- [ ] `php artisan migrate:status` — tutte le migration eseguite
- [ ] Log monitorati (`storage/logs/laravel.log`)
- [ ] Backup MySQL configurato in hPanel
- [ ] Credenziali produzione in password manager

---

## Rollback

- [ ] Build `dist/` precedente archiviata in locale
- [ ] Backup DB prima di `migrate --force`
- [ ] `php artisan down` se serve maintenance mode
