#!/usr/bin/env bash
# One-time Hostinger setup: persistent media directory outside deploy tree.
set -euo pipefail

DOMAIN_PATH="${DOMAIN_PATH:-$HOME/domains/club.backclub.it}"
LARAVEL_PATH="${LARAVEL_PATH:-$DOMAIN_PATH/api}"
MEDIA_PATH="${MEDIA_PATH:-$DOMAIN_PATH/media}"
ENV_FILE="${LARAVEL_PATH}/.env"

mkdir -p "$MEDIA_PATH/clubs"
chmod -R 775 "$MEDIA_PATH"

if [[ -d "$LARAVEL_PATH/storage/app/public/clubs" && ! -L "$LARAVEL_PATH/storage/app/public/clubs" ]]; then
  echo "==> Migrating existing uploads to $MEDIA_PATH/clubs"
  shopt -s dotglob nullglob
  for entry in "$LARAVEL_PATH/storage/app/public/clubs"/*; do
    base="$(basename "$entry")"
    if [[ ! -e "$MEDIA_PATH/clubs/$base" ]]; then
      mv "$entry" "$MEDIA_PATH/clubs/"
    fi
  done
fi

touch "$ENV_FILE"
if grep -q '^MEDIA_ROOT_PATH=' "$ENV_FILE"; then
  sed -i "s|^MEDIA_ROOT_PATH=.*|MEDIA_ROOT_PATH=$MEDIA_PATH|" "$ENV_FILE"
else
  echo "MEDIA_ROOT_PATH=$MEDIA_PATH" >> "$ENV_FILE"
fi

if grep -q '^MEDIA_PUBLIC_URL=' "$ENV_FILE"; then
  sed -i 's|^MEDIA_PUBLIC_URL=.*|MEDIA_PUBLIC_URL=https://club.backclub.it/api/media|' "$ENV_FILE"
else
  echo 'MEDIA_PUBLIC_URL=https://club.backclub.it/api/media' >> "$ENV_FILE"
fi

echo "✅ Media root: $MEDIA_PATH"
echo "   Aggiornato .env → MEDIA_ROOT_PATH + MEDIA_PUBLIC_URL"
echo "   Poi: cd $LARAVEL_PATH && php artisan config:cache"
