#!/usr/bin/env bash
# Per-boot reconciliation: ensure local Postgres is up and the schema is in
# sync, then return so the web dev server (terminals) can connect.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

sudo pg_ctlcluster 16 main start 2>/dev/null || true
for _ in $(seq 1 30); do sudo -u postgres pg_isready -q && break; sleep 1; done

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='gitpress'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE gitpress LOGIN PASSWORD 'gitpress';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='gitpress'" | grep -q 1 \
  || sudo -u postgres createdb -O gitpress gitpress

if [ -f apps/web/.env.local ]; then
  set -a; . apps/web/.env.local; set +a
  pnpm --filter @gitpress/web db:push || true
fi

echo "Postgres ready for GitPress."
