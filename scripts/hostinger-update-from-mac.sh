#!/usr/bin/env bash
# Club CRM — aggiorna produzione Hostinger dal Mac (rsync, NO git sul server)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_PORT="${SSH_PORT:-65002}"
SSH_USER="${SSH_USER:-u589701076}"
SSH_HOST="${SSH_HOST:-82.29.176.135}"
SSH_TARGET="${SSH_USER}@${SSH_HOST}"
DOMAIN="${DOMAIN:-domains/club.backclub.it}"
REMOTE_BASE="${REMOTE_BASE:-~/${DOMAIN}}"
LARAVEL_PATH="${LARAVEL_PATH:-${REMOTE_BASE}/api}"
PUBLIC_HTML="${PUBLIC_HTML:-${REMOTE_BASE}/public_html}"
MEDIA_PATH="${MEDIA_PATH:-${REMOTE_BASE}/media}"
PHP_BIN="${PHP_BIN:-/opt/alt/php84/usr/bin/php}"

echo "==> Build frontend"
cd "$ROOT/frontend"
npm run build
cd "$ROOT"

echo "==> Rsync backend (esclude .env, vendor, upload utente)"
rsync -avz --delete \
  -e "ssh -p ${SSH_PORT}" \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'vendor/' \
  --exclude 'storage/logs/' \
  --exclude 'storage/framework/cache/data/' \
  --exclude 'storage/framework/sessions/' \
  --exclude 'storage/framework/views/' \
  --exclude 'storage/app/public/' \
  --exclude 'bootstrap/cache/*.php' \
  --exclude 'public/' \
  "$ROOT/backend/" "${SSH_TARGET}:${LARAVEL_PATH}/"

echo "==> Rsync frontend SPA"
rsync -avz --delete \
  -e "ssh -p ${SSH_PORT}" \
  --filter 'protect api/' \
  --filter 'protect storage/' \
  --exclude '.htaccess' \
  "$ROOT/frontend/dist/" "${SSH_TARGET}:${PUBLIC_HTML}/"

echo "==> Entry point API + htaccess"
ssh -p "$SSH_PORT" "$SSH_TARGET" "mkdir -p ${PUBLIC_HTML}/api"
scp -P "$SSH_PORT" "$ROOT/docs/hostinger/laravel-public-index.php" "${SSH_TARGET}:${PUBLIC_HTML}/api/index.php"
scp -P "$SSH_PORT" "$ROOT/docs/hostinger/laravel-public.htaccess" "${SSH_TARGET}:${PUBLIC_HTML}/api/.htaccess"
scp -P "$SSH_PORT" "$ROOT/docs/hostinger/public_html.htaccess" "${SSH_TARGET}:${PUBLIC_HTML}/.htaccess"

echo "==> Post-deploy remoto (composer, media, cache)"
ssh -p "$SSH_PORT" "$SSH_TARGET" bash <<REMOTE
set -euo pipefail
cd ${LARAVEL_PATH}
rm -f bootstrap/cache/*.php

mkdir -p ${MEDIA_PATH}/clubs
chmod -R 775 ${MEDIA_PATH} storage

if [ -d storage/app/public/clubs ] && [ "\$(ls -A storage/app/public/clubs 2>/dev/null)" ]; then
  echo "Migro upload da storage/app/public/clubs → media/clubs"
  cp -a storage/app/public/clubs/. ${MEDIA_PATH}/clubs/ 2>/dev/null || true
fi

if ! grep -q '^MEDIA_ROOT_PATH=' .env 2>/dev/null; then
  echo "MEDIA_ROOT_PATH=${MEDIA_PATH}" >> .env
fi
if ! grep -q '^MEDIA_PUBLIC_URL=' .env 2>/dev/null; then
  echo 'MEDIA_PUBLIC_URL=https://club.backclub.it/api/media' >> .env
fi

${PHP_BIN} \$(command -v composer) install --no-dev --optimize-autoloader
${PHP_BIN} artisan migrate --force
${PHP_BIN} artisan config:cache
${PHP_BIN} artisan route:cache

echo "Route media registrata?"
${PHP_BIN} artisan route:list --path=media 2>/dev/null | head -5 || true
REMOTE

echo ""
echo "✅ Deploy completato."
echo "Verifica:"
echo "  curl -s https://club.backclub.it/api/legal/terms | head -c 80"
echo "  ssh ... 'find ${MEDIA_PATH} -type f | head -5'"
