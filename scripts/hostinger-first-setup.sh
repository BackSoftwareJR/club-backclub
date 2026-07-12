#!/usr/bin/env bash
# Club CRM — setup iniziale Hostinger (eseguire UNA volta via SSH sul server)
#
# Layout: dominio singolo club.backclub.it
#   public_html/     → SPA (frontend/dist/)
#   public_html/api/ → solo index.php + .htaccess (entry Laravel)
#   api/             → Laravel app root FUORI public_html (.env, vendor, storage)
#
# Uso:
#   ssh uXXXXX@ssh.hostinger.com
#   bash -s < scripts/hostinger-first-setup.sh
#   oppure copiare lo script sul server ed eseguirlo lì.
#
# Prima di eseguire: crea database MySQL in hPanel e annota le credenziali.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/BackSoftwareJR/club-backclub.git}"
DOMAIN_PATH="${DOMAIN_PATH:-$HOME/domains/club.backclub.it}"
LARAVEL_PATH="${LARAVEL_PATH:-$DOMAIN_PATH/api}"
PUBLIC_HTML="${PUBLIC_HTML:-$DOMAIN_PATH/public_html}"
API_PUBLIC="${API_PUBLIC:-$PUBLIC_HTML/api}"

echo "==> Club CRM — first-time Hostinger setup (single domain)"
echo "    Domain path:   $DOMAIN_PATH"
echo "    Laravel root:  $LARAVEL_PATH"
echo "    public_html:   $PUBLIC_HTML"
echo "    API entry:     $API_PUBLIC"
echo ""

INSTALL_DIR="${INSTALL_DIR:-$HOME/club-crm}"
BACKEND_SRC="${BACKEND_SRC:-$INSTALL_DIR/backend}"

echo "==> Copia template Laravel entry point (public_html/api/)..."
if [[ -f "$INSTALL_DIR/docs/hostinger/laravel-public-index.php" ]]; then
  cp "$INSTALL_DIR/docs/hostinger/laravel-public-index.php" "$API_PUBLIC/index.php"
  cp "$INSTALL_DIR/docs/hostinger/laravel-public.htaccess" "$API_PUBLIC/.htaccess"
else
  echo "    (Esegui dopo il clone del repo, oppure copia manualmente da docs/hostinger/)"
fi

mkdir -p "$DOMAIN_PATH" "$LARAVEL_PATH" "$PUBLIC_HTML" "$API_PUBLIC"

if [[ -d "$BACKEND_SRC" ]]; then
  echo "==> Sync backend → $LARAVEL_PATH (escluso .env e public/)..."
  rsync -a --delete \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude 'public/' \
    --exclude 'storage/logs/' \
    --exclude 'vendor/' \
    "$BACKEND_SRC/" "$LARAVEL_PATH/"
else
  echo "==> Backend non trovato in $BACKEND_SRC"
  echo "    Clona il repo o rsync backend/ manualmente in $LARAVEL_PATH"
fi

echo "==> Composer install (production)..."
cd "$LARAVEL_PATH"
composer install --no-dev --optimize-autoloader

if [[ ! -f .env ]]; then
  echo "==> Creazione .env da template..."
  cp .env.production.example .env
  php artisan key:generate
  echo ""
  echo "⚠️  IMPORTANTE: modifica .env con le credenziali MySQL reali:"
  echo "    nano $LARAVEL_PATH/.env"
  echo ""
  echo "    Imposta almeno: DB_DATABASE, DB_USERNAME, DB_PASSWORD"
  echo "    Verifica: APP_URL=https://club.backclub.it, API_ROUTE_PREFIX= (vuoto)"
  echo "    Verifica: FRONTEND_URL, CORS_ALLOWED_ORIGINS"
  echo ""
  read -r -p "Premi INVIO dopo aver salvato .env (o Ctrl+C per uscire)..."
else
  echo "==> .env già presente, skip."
fi

echo "==> Migrazioni database..."
php artisan migrate --force

echo "==> Storage link..."
php artisan storage:link || true

echo "==> Permessi storage e cache..."
chmod -R 775 storage bootstrap/cache

echo "==> Cache config e route..."
php artisan config:cache
php artisan route:cache

echo "==> Preparazione public_html (SPA root)..."
if [[ -f "$INSTALL_DIR/docs/hostinger/public_html.htaccess" ]]; then
  cp "$INSTALL_DIR/docs/hostinger/public_html.htaccess" "$PUBLIC_HTML/.htaccess"
  echo "    Copiato public_html.htaccess → $PUBLIC_HTML/.htaccess"
fi

if [[ -f "$INSTALL_DIR/docs/hostinger/laravel-public-index.php" ]]; then
  cp "$INSTALL_DIR/docs/hostinger/laravel-public-index.php" "$API_PUBLIC/index.php"
  cp "$INSTALL_DIR/docs/hostinger/laravel-public.htaccess" "$API_PUBLIC/.htaccess"
  echo "    Copiato Laravel entry → $API_PUBLIC/"
fi

echo ""
echo "==> Cron Laravel scheduler (aggiungi in hPanel → Cron Jobs):"
echo "    * * * * * cd $LARAVEL_PATH && php artisan schedule:run >> /dev/null 2>&1"
echo ""

echo "==> Frontend: buildare in locale e caricare dist/ con rsync (vedi scripts/deploy.sh)"
echo "    rsync -avz --delete frontend/dist/ USER@HOST:$PUBLIC_HTML/"
echo ""
echo "✅ Setup backend completato."
echo "   Verifica: curl -s https://club.backclub.it/api/up"
echo "   Verifica: curl -s https://club.backclub.it/api/entry/1/NFC-OWNER-001"
