#!/bin/sh
set -e

if [ -z "${DATABASE_URL_AUTH:-}" ]; then
  echo "[auth-service] DATABASE_URL_AUTH no definida" >&2
  exit 1
fi

export DATABASE_URL="$DATABASE_URL_AUTH"

if [ -n "${PORT:-}" ]; then
  export AUTH_PORT="$PORT"
fi

# El pooler de Supabase ignora ?schema=, así que migrate deploy no encuentra
# _prisma_migrations. En Render se usa SKIP_MIGRATIONS=true y se migra aparte.
if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
  echo "[auth-service] SKIP_MIGRATIONS=true: se omiten las migraciones"
else
  echo "[auth-service] Aplicando migraciones Prisma..."
  npx --yes prisma@6.19.3 migrate deploy --schema=./prisma/schema.prisma
fi

echo "[auth-service] Iniciando API en puerto ${AUTH_PORT:-3001}..."
exec node dist/main.js
