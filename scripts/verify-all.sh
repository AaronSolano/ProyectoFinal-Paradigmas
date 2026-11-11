#!/usr/bin/env sh
# ProfeLink - verificacion previa a la defensa (lint, unit, integracion, contenedores).
# Uso: sh scripts/verify-all.sh [--skip-containers] [--e2e]
set -u

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

SKIP_CONTAINERS=0
RUN_E2E=0
for arg in "$@"; do
  case "$arg" in
    --skip-containers) SKIP_CONTAINERS=1 ;;
    --e2e) RUN_E2E=1 ;;
  esac
done

FAILED=0
SUMMARY=""

check() {
  name="$1"
  shift
  printf '\n=== %s ===\n' "$name"
  if "$@"; then
    SUMMARY="${SUMMARY}PASS  ${name}\n"
  else
    SUMMARY="${SUMMARY}FAIL  ${name}\n"
    FAILED=1
  fi
}

containers_running() {
  bad=0
  for n in profelink-postgres profelink-auth-service profelink-game-service profelink-otel-collector profelink-grafana; do
    state="$(docker inspect --format '{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "$n" 2>/dev/null || echo missing)"
    case "$state" in
      "true"|"true healthy"|"true ") echo "  $n OK" ;;
      *) echo "  $n -> $state"; bad=1 ;;
    esac
  done
  return $bad
}

grafana_health() {
  curl -fsS --max-time 10 http://localhost:3000/api/health >/dev/null
}

check "Lint (tsc --noEmit)" pnpm lint
check "Unit tests" pnpm test
check "Integration tests (auth-service)" pnpm --filter @profelink/auth-service --if-present test:e2e
check "Integration tests (game-service)" pnpm --filter @profelink/game-service --if-present test:e2e

if [ "$SKIP_CONTAINERS" -eq 0 ]; then
  check "docker compose config" docker compose config -q
  check "Containers running" containers_running
  check "Grafana health (http://localhost:3000)" grafana_health
fi

if [ "$RUN_E2E" -eq 1 ]; then
  check "Playwright E2E" pnpm test:e2e
fi

printf '\n=== Resumen ===\n'
printf '%b' "$SUMMARY"
if [ "$FAILED" -ne 0 ]; then
  exit 1
fi
echo "Todo verificado."
