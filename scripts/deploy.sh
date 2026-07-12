#!/usr/bin/env bash
# Club CRM — deploy locale: test, build, push GitHub, istruzioni SSH Hostinger
#
# Uso:
#   cp scripts/deploy.config.example scripts/deploy.config   # una tantum
#   ./scripts/deploy.sh
#
# Opzioni:
#   DEPLOY_AUTO_COMMIT=1  — commit automatico senza conferma
#   DEPLOY_SKIP_PUSH=1    — salta git push
#   DEPLOY_SKIP_GIT=1     — salta add/commit/push

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$ROOT/scripts/deploy.config"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${BLUE}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✔${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
err()   { echo -e "${RED}✖${NC} $*" >&2; }

block() {
  local title="$1"
  shift
  echo ""
  echo -e "${BOLD}${CYAN}# === ${title} ===${NC}"
  echo "$@"
}

cd "$ROOT"

# --- Config opzionale ---
SSH_USER="${HOSTINGER_SSH_USER:-u123456789}"
SSH_HOST="${HOSTINGER_SSH_HOST:-ssh.hostinger.com}"
BACKEND_PATH="${HOSTINGER_BACKEND_PATH:-/home/u123456789/club-crm/backend}"
REPO_PATH="${HOSTINGER_REPO_PATH:-/home/u123456789/club-crm}"
FRONTEND_PATH="${HOSTINGER_FRONTEND_PATH:-/home/u123456789/domains/club.backclub.it/public_html}"
API_PUBLIC_PATH="${HOSTINGER_API_PUBLIC_PATH:-/home/u123456789/domains/api.club.backclub.it/public_html}"

if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$CONFIG_FILE"
  ok "Config caricata: scripts/deploy.config"
else
  warn "scripts/deploy.config non trovato — uso placeholder (cp scripts/deploy.config.example scripts/deploy.config)"
fi

SSH_TARGET="${SSH_USER}@${SSH_HOST}"

echo ""
echo -e "${BOLD}Club CRM — Deploy locale${NC}"
echo "========================"
echo ""

# --- 1. Backend tests ---
info "Esecuzione test backend..."
cd "$ROOT/backend"
php artisan test
ok "Test backend superati"
cd "$ROOT"

# --- 2. Frontend build ---
info "Build frontend produzione..."
cd "$ROOT/frontend"
if [[ ! -f .env.production ]]; then
  cp .env.production.example .env.production
  ok "Creato .env.production da template"
fi
npm run build
ok "Build frontend completata (frontend/dist/)"
cd "$ROOT"

# --- 3. Git commit & push ---
if [[ "${DEPLOY_SKIP_GIT:-0}" != "1" ]]; then
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    err "Non è un repository git. Inizializza git prima del deploy."
    exit 1
  fi

  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
    warn "Branch corrente: $BRANCH (push su origin/$BRANCH)"
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git status --short
    COMMIT_MSG="Deploy $(date +%Y-%m-%d_%H-%M-%S)"

    if [[ "${DEPLOY_AUTO_COMMIT:-0}" == "1" ]]; then
      git commit -m "$COMMIT_MSG"
      ok "Commit automatico: $COMMIT_MSG"
    else
      echo ""
      read -r -p "Creare commit \"$COMMIT_MSG\"? [y/N] " confirm
      if [[ "$confirm" =~ ^[Yy]$ ]]; then
        git commit -m "$COMMIT_MSG"
        ok "Commit creato"
      else
        warn "Commit saltato"
      fi
    fi
  else
    ok "Working tree pulito — nessun commit necessario"
  fi

  if [[ "${DEPLOY_SKIP_PUSH:-0}" != "1" ]]; then
    if git rev-parse "@{u}" >/dev/null 2>&1 || git ls-remote --heads origin "$BRANCH" | grep -q .; then
      info "Push su origin/$BRANCH..."
      git push origin "$BRANCH"
      ok "Push completato"
    else
      warn "Nessun remote tracking — esegui manualmente: git push -u origin $BRANCH"
    fi
  fi
fi

# --- 4. Istruzioni SSH copy-paste ---
echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Comandi SSH per Hostinger (copy-paste)${NC}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════════${NC}"

block "BACKEND UPDATE (git pull + composer + migrate + cache)" \
"ssh ${SSH_TARGET} \"cd ${REPO_PATH} && git pull && cd ${BACKEND_PATH} && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan config:cache && php artisan route:cache\""

block "FRONTEND UPDATE (rsync da questa macchina)" \
"rsync -avz --delete ${ROOT}/frontend/dist/ ${SSH_TARGET}:${FRONTEND_PATH}/"

if [[ -n "${API_PUBLIC_PATH:-}" ]]; then
  block "API PUBLIC SYNC (solo se document root NON punta a backend/public)" \
"rsync -avz --delete ${ROOT}/backend/public/ ${SSH_TARGET}:${API_PUBLIC_PATH}/"
fi

block "MIGRATIONS ONLY" \
"ssh ${SSH_TARGET} \"cd ${BACKEND_PATH} && php artisan migrate --force\""

block "VERIFICA POST-DEPLOY" \
"curl -s https://api.club.backclub.it/up
curl -sI https://club.backclub.it | head -5"

echo ""
info "Documentazione: docs/HOSTINGER_STRUCTURE.md"
info "GitHub Actions auto-deploy: configura i secret in Settings → Secrets → Actions"
echo ""
