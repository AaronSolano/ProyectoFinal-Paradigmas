#!/usr/bin/env sh
# ProfeLink — arranque Docker Compose (postgres-db, auth-service, game-service cuando exista)
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Requisito no encontrado en PATH: $1" >&2
    exit 1
  fi
}

require_cmd docker
docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose v2 no disponible." >&2
  exit 1
}

if [ ! -f .env ]; then
  [ -f .env.example ] || {
    echo "Falta .env.example" >&2
    exit 1
  }
  cp .env.example .env
  echo "Creado .env desde .env.example"
fi

echo "Levantando servicios ProfeLink (Compose)..."
docker compose up -d --build

wait_healthy() {
  name="$1"
  timeout="${2:-120}"
  end=$(( $(date +%s) + timeout ))
  while :; do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || true)"
    if [ "$health" = "healthy" ]; then
      return 0
    fi
    if [ "$health" = "none" ]; then
      running="$(docker inspect --format '{{.State.Running}}' "$name" 2>/dev/null || echo false)"
      if [ "$running" = "true" ]; then
        return 0
      fi
    fi
    if [ "$(date +%s)" -gt "$end" ]; then
      return 1
    fi
    sleep 2
  done
}

echo "Esperando PostgreSQL..."
wait_healthy profelink-postgres 120 || {
  echo "Timeout postgres-db" >&2
  exit 1
}
echo "PostgreSQL listo."

echo "Esperando auth-service..."
wait_healthy profelink-auth-service 180 || {
  echo "Timeout auth-service" >&2
  exit 1
}
echo "auth-service listo."

if docker ps --format '{{.Names}}' | grep -qx 'profelink-game-service'; then
  echo "Esperando game-service..."
  wait_healthy profelink-game-service 180 || {
    echo "Timeout game-service" >&2
    exit 1
  }
  echo "game-service listo."
fi

echo "Arranque completado."
