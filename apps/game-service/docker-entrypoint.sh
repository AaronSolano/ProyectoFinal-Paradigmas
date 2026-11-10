#!/bin/sh
set -e

if [ -z "${DATABASE_URL_GAME:-}" ]; then
  echo "[game-service] DATABASE_URL_GAME no definida" >&2
  exit 1
fi

export DATABASE_URL="$DATABASE_URL_GAME"

echo "[game-service] Aplicando migraciones Prisma..."
npx --yes prisma@6.19.3 migrate deploy --schema=./prisma/schema.prisma

echo "[game-service] Iniciando API en puerto ${GAME_PORT:-3002}..."
exec node dist/main.js
