## 1. Runtime configuration

- [x] 1.1 Listen on `PORT` when Render sets it, and keep 3001 and 3002 when it does not.
- [x] 1.2 Append exact `CORS_ORIGINS` without accepting a wildcard.
- [x] 1.3 Rewrite the auth Prisma schema to `verix_auth` only in the production image build.

## 2. Deployment assets

- [x] 2.1 Add `render.yaml` for the two free API services. Browser origins are requested in the dashboard.
- [x] 2.2 Add `.env.production.example` with placeholders and the existing JWT audience.
- [x] 2.3 Add the manual Supabase schema script for `verix_auth` and `game`.

## 3. Verification

- [x] 3.1 Cover the port, CORS, and schema rewrite with isolated unit tests.
- [ ] 3.2 Create the Supabase project, run the schema script there, and fill Render secrets. This remains a manual step and is not executed here.
