#!/bin/sh
set -e

if [ -z "${DATABASE_URL_AUTH:-}" ]; then
  echo "[auth-service] DATABASE_URL_AUTH no definida" >&2
  exit 1
fi

export DATABASE_URL="$DATABASE_URL_AUTH"

echo "[auth-service] Aplicando migraciones Prisma..."
npx --yes prisma@6.19.3 migrate deploy --schema=./prisma/schema.prisma

echo "[auth-service] Iniciando API en puerto ${AUTH_PORT:-3001}..."
exec node dist/main.js
