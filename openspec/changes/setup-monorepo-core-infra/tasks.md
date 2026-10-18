## 1. Monorepo Base Setup

- [ ] 1.1 Create root `package.json` with monorepo scripts (`build`, `dev`, `lint`, `test`) and devDependencies.
- [ ] 1.2 Create `pnpm-workspace.yaml` configuring `apps/*` and `packages/*`.
- [ ] 1.3 Create base TypeScript configurations (`tsconfig.base.json`, `tsconfig.json`).
- [ ] 1.4 Scaffold directory structure for `apps/` (`auth-service`, `game-service`, `web-client`, `external-consumer`) and `packages/` (`shared-dtos`).

## 2. Shared Contracts Package (`packages/shared-dtos`)

- [ ] 2.1 Initialize `packages/shared-dtos/package.json` and `tsconfig.json`.
- [ ] 2.2 Implement domain enums: `SessionStatus` (`WAITING`, `QUESTION_ACTIVE`, `QUESTION_CLOSED`, `FINISHED`) and `UserRole` (`HOST`, `PARTICIPANT`).
- [ ] 2.3 Implement WebSocket event name constants and payload type definitions.
- [ ] 2.4 Setup build script and verify successful compilation of `@profelink/shared-dtos`.

## 3. Containerized Infrastructure and Persistence

- [ ] 3.1 Create `docker-compose.yml` defining the `postgres-db` service with healthcheck, persistent volume `pgdata`, and network `profelink-net`.
- [ ] 3.2 Add volume mount `quiz_images` (`/app/uploads`) to `docker-compose.yml` for media persistence.
- [ ] 3.3 Create database initialization script `docker/postgres/init-schemas.sql` to provision `auth` and `game` schemas on startup.

## 4. Environment Configuration and Automation

- [ ] 4.1 Create standardized `.env.example` with ports, PostgreSQL URLs per schema, and `JWT_AUDIENCE=profelink-game-api`.
- [ ] 4.2 Implement PowerShell startup script `start.ps1` with environment validation and Docker Compose bootstrap.
- [ ] 4.3 Implement POSIX startup script `start.sh` with executable permissions and validation logic.

## 5. Verification and Smoke Testing

- [ ] 5.1 Test workspace dependency linking with `pnpm install` and compilation with `pnpm build`.
- [ ] 5.2 Validate Docker Compose syntax and verify PostgreSQL starts with `auth` and `game` schemas initialized.
- [ ] 5.3 Verify data and volume persistence across `docker compose restart`.
