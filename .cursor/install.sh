#!/usr/bin/env bash
# Idempotent dependency + local-state setup for the GitPress.net platform.
# Runs after the repository is checked out. Safe to run repeatedly.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# --- System dependency: local Postgres (metadata store) --------------------
# Normally baked into the environment snapshot; installed here as a fallback so
# the setup is reproducible on a bare base image as well.
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq postgresql postgresql-contrib
fi

# --- JS/TS dependencies -----------------------------------------------------
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

# --- Local platform env file (only created if absent) -----------------------
env_file="apps/web/.env.local"
if [ ! -f "$env_file" ]; then
  cat > "$env_file" <<EOF
# Auto-generated local dev env. OAuth pairs are blank (login buttons hidden
# until you fill a pair in — see apps/web/.env.example).
DATABASE_URL="postgres://gitpress:gitpress@127.0.0.1:5432/gitpress"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="http://localhost:3000"
GITPRESS_THEMES_REPO="tap6/gitpress"
GITPRESS_BUILD_ACTION_REPO="tap6/build-action"
GITPRESS_SECRET_KEY="$(openssl rand -base64 32)"
EOF
fi

# --- Bring Postgres up + apply the Drizzle schema ---------------------------
sudo pg_ctlcluster 16 main start 2>/dev/null || true
for _ in $(seq 1 30); do sudo -u postgres pg_isready -q && break; sleep 1; done

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='gitpress'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE gitpress LOGIN PASSWORD 'gitpress';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='gitpress'" | grep -q 1 \
  || sudo -u postgres createdb -O gitpress gitpress

set -a; . "$env_file"; set +a
pnpm --filter @gitpress/web db:push

echo "GitPress install complete."
