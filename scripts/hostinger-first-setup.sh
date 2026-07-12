#!/usr/bin/env bash
# Club CRM — setup iniziale Hostinger (eseguire UNA volta via SSH sul server)
#
# Uso:
#   ssh uXXXXX@ssh.hostinger.com
#   bash -s < scripts/hostinger-first-setup.sh
#   oppure copiare lo script sul server ed eseguirlo lì.
#
# Prima di eseguire: crea database MySQL in hPanel e annota le credenziali.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/BackSoftwareJR/club-backclub.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/club-crm}"
BACKEND_DIR="${BACKEND_DIR:-$INSTALL_DIR/backend}"
FRONTEND_PUBLIC="${FRONTEND_PUBLIC:-$HOME/domains/club.backclub.it/public_html}"
API_PUBLIC="${API_PUBLIC:-$HOME/domains/api.club.backclub.it/public_html}"

echo "==> Club CRM — first-time Hostinger setup"
echo "    Install dir:  $INSTALL_DIR"
echo "    Backend:      $BACKEND_DIR"
echo ""

if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "==> Repository già presente, git pull..."
  git -C "$INSTALL_DIR" pull
else
  echo "==> Clone repository..."
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

echo "==> Composer install (production)..."
cd "$BACKEND_DIR"
composer install --no-dev --optimize-autoloader

if [[ ! -f .env ]]; then
  echo "==> Creazione .env da template..."
  cp .env.production.example .env
  php artisan key:generate
  echo ""
  echo "⚠️  IMPORTANTE: modifica .env con le credenziali MySQL reali:"
  echo "    nano $BACKEND_DIR/.env"
  echo ""
  echo "    Imposta almeno: DB_DATABASE, DB_USERNAME, DB_PASSWORD"
  echo "    Verifica: APP_URL, CORS_ALLOWED_ORIGINS, FRONTEND_URL"
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

echo "==> Preparazione cartelle frontend..."
mkdir -p "$FRONTEND_PUBLIC"
if [[ -f "$INSTALL_DIR/docs/hostinger/spa-root.htaccess" ]]; then
  cp "$INSTALL_DIR/docs/hostinger/spa-root.htaccess" "$FRONTEND_PUBLIC/.htaccess"
  echo "    Copiato spa-root.htaccess → $FRONTEND_PUBLIC/.htaccess"
fi

echo ""
echo "==> Configurazione sottodominio API"
echo "    Opzione A (consigliata): in hPanel imposta document root di api.club.backclub.it su:"
echo "    $BACKEND_DIR/public"
echo ""
echo "    Opzione B: symlink public_html API → backend/public:"
echo "    rm -rf $API_PUBLIC && ln -s $BACKEND_DIR/public $API_PUBLIC"
echo ""

echo "==> Cron Laravel scheduler (aggiungi in hPanel → Cron Jobs):"
echo "    * * * * * cd $BACKEND_DIR && php artisan schedule:run >> /dev/null 2>&1"
echo ""

echo "==> Frontend: buildare in locale e caricare dist/ con rsync (vedi scripts/deploy.sh)"
echo ""
echo "✅ Setup backend completato."
echo "   Verifica: curl -s https://api.club.backclub.it/up"
