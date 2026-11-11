## Context

Auth and game already use one PostgreSQL database with schemas `auth` and `game`. Supabase reserves the schema `auth` for its own `auth.users` table, so the existing auth migration cannot create `users` there. Render injects `PORT` and does not provide a durable disk on the free plan. Socket.IO stays attached to game-service. The JWT audience stays `profelink-game-api`.

## Goals / Non-Goals

**Goals:**

- Give both APIs a production configuration that can be deployed later from the dashboard.
- Leave local ports, local schemas, and the local database untouched.
- Document the exact manual clicks for Supabase and Render.

**Non-Goals:**

- Running migrations, seeds, Docker Compose, or a real deploy.
- Changing scoring, question flow, or image storage to object storage.
- Adding Grafana, Playwright, or a paid Render disk.

## Decisions

1. **Schema `verix_auth` only inside the production auth image.** The committed `schema.prisma` keeps `@@schema("auth")`. Docker build argument `PRISMA_AUTH_SCHEMA` defaults to `auth`. Render sets it to `verix_auth` before `prisma generate`, so the generated client and the `?schema=verix_auth` URL agree. Local compose does not pass the argument.
2. **Schema `game` stays `game`.** It does not exist on a new Supabase project, so the manual SQL creates it before migrate. Later migrations already qualify `"game"`.
3. **One session-pooler URL on port 5432 for runtime and migrate.** Port 6543 is transaction mode and breaks Prisma migrate. The direct `db.*.supabase.co` host is not required, which avoids the IPv6-only direct connection.
4. **`PORT` wins over `AUTH_PORT` and `GAME_PORT` only when it is a valid integer.** Local processes that do not set `PORT` keep 3001 and 3002. The process binds `0.0.0.0`.
5. **CORS stays an explicit list.** `CORS_ORIGINS` appends origins. `*` is discarded. Socket.IO continues to use its current gateway CORS.
6. **Uploads stay on the container filesystem.** Free Render disk is ephemeral. That limit is documented instead of introducing a new storage provider.
7. **The entrypoint still runs `prisma migrate deploy` when a container starts.** This change does not invoke that command.

## Risks / Trade-offs

- The production auth client and the local auth client are generated from different schema names. A Render build without `PRISMA_AUTH_SCHEMA=verix_auth` would target Supabase `auth.users` and fail.
- Question images uploaded on Render disappear when the free service restarts.
- Free services sleep. The first request after sleep is slow, and an in-memory live room does not survive a restart.
- Demo users are not seeded. They must be registered through `POST /api/auth/register` after the first successful boot.

## Migration Plan

1. Create the Supabase project and run `scripts/supabase/00-create-schemas.sql` in its SQL editor.
2. Create the two free API services from `render.yaml` and fill the blank secrets from `.env.production.example`. Set `CORS_ORIGINS` to the real Vercel origins.
3. Mark `PRISMA_AUTH_SCHEMA` as available during the auth image build.
4. Deploy only after that confirmation. The container entrypoint applies the existing migrations. Do not run them against the local database.

## Open Questions

- None for this preparation. Connecting the accounts remains a manual step.
