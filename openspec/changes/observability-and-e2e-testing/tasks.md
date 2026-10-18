## 1. OpenTelemetry Backend Instrumentation

- [ ] 1.1 Add OpenTelemetry SDK dependencies to `apps/auth-service` and implement tracing initialization.
- [ ] 1.2 Add OpenTelemetry SDK dependencies to `apps/game-service` and instrument HTTP and Socket.io handlers.

## 2. Telemetry Infrastructure & Dashboards

- [ ] 2.1 Add `otel-collector` service with configuration `otel-collector-config.yaml` to `docker-compose.yml`.
- [ ] 2.2 Add `grafana` service with provisioning volume to `docker-compose.yml`.
- [ ] 2.3 Create dashboard JSON definition `docker/grafana/dashboards/profelink-overview.json`.

## 3. End-to-End Testing with Playwright

- [ ] 3.1 Configure `@playwright/test` at root with multi-browser settings (`playwright.config.ts`).
- [ ] 3.2 Implement multiplayer E2E test `e2e/multiplayer-game.spec.ts` (1 Host + 2 Players, lobby join, V/F answer submission, podium verification).
- [ ] 3.3 Add `pnpm test:e2e` script to root `package.json`.

## 4. Defense Checklist & Verification Script

- [ ] 4.1 Implement `scripts/verify-all.ps1` and `scripts/verify-all.sh` running linter, unit tests, integration tests, and container checks.
- [ ] 4.2 Validate full readiness against the 40 points / 6 checks of the evaluation rubric.
