## Why

VeriX needs a free hosted demo on Supabase PostgreSQL and Render before the delivery deadline. The local Docker database, ports, and schemas must keep working unchanged.

## What Changes

- Prepare two free Render Docker services, auth-service and game-service, without deploying them. The web clients stay outside this blueprint.
- Teach both APIs to listen on Render's `PORT` while local `AUTH_PORT` and `GAME_PORT` stay in effect when `PORT` is absent.
- Allow exact browser origins from `CORS_ORIGINS` in addition to the two localhost clients. Never use a wildcard.
- Keep the Prisma schema name `auth` for local PostgreSQL. The auth image rewrites that name to `verix_auth` only when `PRISMA_AUTH_SCHEMA` is set at build time, because Supabase already owns `auth.users`.
- Keep the game schema name `game`, Socket.IO on the game service, and the JWT audience `profelink-game-api`.
- Add example production variables and a manual Supabase schema script. Do not run migrations, seeds, or a deploy from this change.

## Capabilities

### New Capabilities

- `hosted-deployment`: Production configuration for Supabase PostgreSQL and Render, isolated from the local environment.

### Modified Capabilities

## Impact

- `apps/auth-service` and `apps/game-service` listen port, CORS, and the auth Docker build.
- `render.yaml`, `.env.production.example`, and `scripts/supabase/00-create-schemas.sql`.
- No change to game scoring, Prisma migrations, or the local database.
