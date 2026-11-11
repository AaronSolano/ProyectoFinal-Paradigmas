## ADDED Requirements

### Requirement: Production listen port without changing local ports
auth-service and game-service SHALL listen on `PORT` when that value is an integer from 1 to 65535. When `PORT` is absent or invalid, auth-service SHALL listen on `AUTH_PORT` or 3001, and game-service SHALL listen on `GAME_PORT` or 3002. Both SHALL bind all interfaces.

#### Scenario: Local process without PORT
- **WHEN** auth-service starts without `PORT` and with `AUTH_PORT` 3001
- **THEN** it listens on port 3001

#### Scenario: Render assigns PORT
- **WHEN** game-service starts with `PORT` 10000 and `GAME_PORT` 3002
- **THEN** it listens on port 10000

### Requirement: Supabase schemas do not replace the local schemas
The committed Prisma schema for auth SHALL remain `auth`, and the committed Prisma schema for game SHALL remain `game`. The auth production image SHALL rewrite its schema to `verix_auth` only when `PRISMA_AUTH_SCHEMA` is `verix_auth` at build time. The game service SHALL continue to use schema `game`.

#### Scenario: Local schema file
- **WHEN** the auth schema rewrite runs with `PRISMA_AUTH_SCHEMA` equal to `auth`
- **THEN** the schema source still declares `auth` and is unchanged

#### Scenario: Production auth image
- **WHEN** the auth schema rewrite runs with `PRISMA_AUTH_SCHEMA` equal to `verix_auth`
- **THEN** the rewritten source declares `verix_auth` and the original source still declares `auth`

### Requirement: Production configuration contains no secrets
The repository SHALL include a Render blueprint and a production environment example with placeholders for the database password and `JWT_SECRET`. The JWT audience SHALL remain `profelink-game-api` and the issuer SHALL remain `profelink-auth-service`. Socket.IO SHALL remain served by game-service.

#### Scenario: Example environment
- **WHEN** a reviewer reads `.env.production.example`
- **THEN** the database user and password are placeholders, and the JWT audience is `profelink-game-api`

### Requirement: Preparation does not apply database changes
Creating this configuration SHALL NOT execute Prisma migrations, seeds, or SQL against PostgreSQL.

#### Scenario: Schema script is present but not executed
- **WHEN** the preparation is complete in the repository
- **THEN** `scripts/supabase/00-create-schemas.sql` exists for manual use and no migration has been applied by the preparation
