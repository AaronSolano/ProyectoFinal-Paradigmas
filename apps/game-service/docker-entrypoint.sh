#!/bin/sh
set -e

if [ -z "${DATABASE_URL_GAME:-}" ]; then
  echo "[game-service] DATABASE_URL_GAME no definida" >&2
  exit 1
fi

export DATABASE_URL="$DATABASE_URL_GAME"

if [ -n "${PORT:-}" ]; then
  export GAME_PORT="$PORT"
fi

# El pooler de Supabase ignora ?schema=, así que migrate deploy no encuentra
# _prisma_migrations. En Render se usa SKIP_MIGRATIONS=true y se migra aparte.
if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
  echo "[game-service] SKIP_MIGRATIONS=true: se omiten las migraciones"
else
  echo "[game-service] Aplicando migraciones Prisma..."
  npx --yes prisma@6.19.3 migrate deploy --schema=./prisma/schema.prisma
fi

echo "[game-service] Iniciando API en puerto ${GAME_PORT:-3002}..."
exec node dist/main.js
