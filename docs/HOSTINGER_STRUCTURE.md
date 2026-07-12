# Struttura Hostinger — Club CRM

Guida alla disposizione file su **Hostinger shared hosting** per:

| Host | Ruolo |
|------|-------|
| `https://club.backclub.it` | SPA React (build statico) |
| `https://api.club.backclub.it` | API Laravel 13 |

Repository: [BackSoftwareJR/club-backclub](https://github.com/BackSoftwareJR/club-backclub)

---

## Albero cartelle consigliato

```
/home/uXXXXX/
│
├── club-crm/                              ← clone Git (monorepo, NON web-accessible)
│   ├── backend/                           ← root Laravel (artisan, .env, vendor/)
│   │   ├── app/
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── database/
│   │   ├── public/                        ← unica cartella Laravel esposta al web
│   │   │   ├── index.php
│   │   │   └── .htaccess
│   │   ├── routes/
│   │   ├── storage/
│   │   ├── vendor/
│   │   └── .env                           ← SEGRETI — mai in public_html
│   ├── frontend/                          ← sorgenti (non serviti in produzione)
│   └── docs/
│
├── domains/
│   ├── club.backclub.it/
│   │   └── public_html/                   ← contenuto di frontend/dist/
│   │       ├── index.html
│   │       ├── assets/
│   │       └── .htaccess                  ← da docs/hostinger/spa-root.htaccess
│   │
│   └── api.club.backclub.it/
│       └── public_html/                   ← opzione B: copia/symlink di backend/public/
│           ├── index.php
│           └── .htaccess
│
└── .ssh/                                  ← chiavi SSH (solo utente)
```

### Variante compatta (Laravel root = `club-crm`)

Se preferisci non tenere la sottocartella `backend/` sul server, puoi copiare **solo** il contenuto di `backend/` in `~/club-crm/` (senza il prefisso `backend/`). In quel caso `HOSTINGER_BACKEND_PATH=/home/uXXXXX/club-crm`. Il monorepo resta clonato altrove o si aggiorna via rsync da CI.

---

## Perché `.env` e `vendor/` restano fuori da `public_html`

```
                    INTERNET
                        │
                        ▼
              ┌─────────────────────┐
              │   public_html       │  ← solo file pubblici (index.php, assets SPA)
              │   (document root)   │
              └──────────┬──────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
   SPA statica                    Laravel public/
   (HTML/JS/CSS)                  index.php → bootstrap
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  club-crm/backend │  ← NON raggiungibile via URL
                              │  .env, vendor,    │
                              │  storage, config  │
                              └──────────────────┘
```

| File/cartella | Perché NON in `public_html` |
|---------------|----------------------------|
| `.env` | Contiene password DB, `APP_KEY`, chiavi JWT e Canopywave |
| `vendor/` | Codice Composer; esporlo aumenta superficie d'attacco |
| `storage/` | Log, cache, upload utenti |
| `config/`, `app/`, `routes/` | Logica applicativa — Laravel espone solo `public/` |

Se un visitatore potesse scaricare `.env`, avrebbe accesso completo al database.

---

## Esporre l'API: due opzioni

### Opzione A — Document root verso `backend/public` (consigliata)

In **hPanel → Domini → api.club.backclub.it → Document root**, imposta:

```
/home/uXXXXX/club-crm/backend/public
```

**Vantaggi:** nessuna copia da mantenere; `git pull` + `composer install` aggiornano tutto; symlink non necessario.

**Svantaggi:** su alcuni piani Hostinger il path deve restare sotto `domains/.../public_html` — verifica nel pannello se accetta path personalizzati fuori da `public_html`.

### Opzione B — `public_html` del sottodominio API

Se hPanel **non** permette di puntare fuori da `domains/.../public_html`:

1. **Copia** (rsync) il contenuto di `backend/public/` in  
   `domains/api.club.backclub.it/public_html/`
2. Modifica `index.php` in `public_html` se i path relativi non coincidono — Laravel di default risale di una cartella; se la root Laravel è `~/club-crm/backend`, copiare solo `public/` **rompe** i path.

   **Soluzione corretta con copia:** usare symlink o un `index.php` ad hoc. Meglio:

3. **Symlink** (se SSH lo consente):

```bash
# Da eseguire UNA volta via SSH
rm -rf ~/domains/api.club.backclub.it/public_html/*
ln -sf ~/club-crm/backend/public/* ~/domains/api.club.backclub.it/public_html/
# oppure symlink dell'intera cartella public
rm -rf ~/domains/api.club.backclub.it/public_html
ln -s ~/club-crm/backend/public ~/domains/api.club.backclub.it/public_html
```

#### Limitazioni symlink su shared hosting

| Aspetto | Nota |
|---------|------|
| `FollowSymLinks` | Apache deve averlo abilitato (di solito sì su Hostinger) |
| hPanel “Document root” | Deve puntare a `public_html` che contiene il symlink |
| Backup hPanel | A volte non segue symlink — backup manuale del codice |
| Sicurezza | Il symlink **non** espone `.env` se punta solo a `public/` |
| Piano economico | Alcuni piani disabilitano symlink — usa Opzione A o script rsync |

Se symlink fallisce, usa **Opzione A** o uno script post-deploy che rsync `backend/public/` → `HOSTINGER_API_PUBLIC_PATH`.

---

## SSL (HTTPS)

1. hPanel → **SSL** → attiva **Free SSL** per:
   - `club.backclub.it`
   - `api.club.backclub.it`
2. Forza HTTPS (toggle hPanel o regole `.htaccess`)
3. Verifica:

```bash
curl -sI https://club.backclub.it | head -3
curl -sI https://api.club.backclub.it/up | head -3
```

---

## CORS e comunicazione SPA ↔ API

```
┌─────────────────────────┐         HTTPS          ┌──────────────────────────┐
│  club.backclub.it       │  ──── fetch /api ────►  │  api.club.backclub.it    │
│  (origine browser)      │  ◄── JSON + CORS ────   │  (Laravel)               │
└─────────────────────────┘                          └──────────────────────────┘
```

Nel `.env` del backend (creato manualmente sul server da `.env.production.example`):

```dotenv
APP_URL=https://api.club.backclub.it
FRONTEND_URL=https://club.backclub.it
CORS_ALLOWED_ORIGINS=https://club.backclub.it
```

Nel build frontend (`frontend/.env.production`):

```dotenv
VITE_API_URL=https://api.club.backclub.it/api
```

Dopo ogni modifica al `.env` sul server:

```bash
cd ~/club-crm/backend && php artisan config:cache
```

---

## URL NFC (produzione)

Programma i tag NFC con:

```
https://club.backclub.it/entry/{club_id}/{nfc_uid}
```

Esempi (club `id = 1` dopo seed):

| Ruolo | URL |
|-------|-----|
| Owner | `https://club.backclub.it/entry/1/NFC-OWNER-001` |
| Member | `https://club.backclub.it/entry/1/NFC-MEMBER-001` |

La SPA gestisce il routing client-side; l'API risponde su `https://api.club.backclub.it/api/entry/...`.

---

## Credenziali database (`.env` sul server)

**Non committare mai** il `.env` di produzione. Sul server, una tantum:

```bash
cd ~/club-crm/backend
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
git push ─────────────────────► git pull (backend)
npm run build                   rsync dist → club public_html
php artisan test (CI)           composer install --no-dev
                                php artisan migrate --force
                                php artisan config:cache
```

Script locali: [`../scripts/deploy.sh`](../scripts/deploy.sh)  
CI/CD: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

---

## Documenti correlati

- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — checklist giorno del deploy
- [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md) — guida operativa estesa
- [hostinger/README.md](hostinger/README.md) — file `.htaccess`
- [`scripts/hostinger-first-setup.sh`](../scripts/hostinger-first-setup.sh) — setup iniziale server
