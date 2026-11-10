FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared-dtos ./packages/shared-dtos
COPY apps/auth-service ./apps/auth-service
RUN pnpm install --frozen-lockfile --filter @profelink/shared-dtos --filter @profelink/auth-service \
  && pnpm --filter @profelink/shared-dtos build \
  && pnpm --filter @profelink/auth-service prisma:generate \
  && pnpm --filter @profelink/auth-service build \
  && pnpm --filter @profelink/auth-service deploy --prod /out/auth-service \
  && mkdir -p /out/auth-service/node_modules/@profelink \
  && cp -r /app/apps/auth-service/node_modules/@profelink/auth-prisma /out/auth-service/node_modules/@profelink/

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl curl
WORKDIR /app
ENV NODE_ENV=production
ENV AUTH_PORT=3001
COPY --from=build /out/auth-service ./
COPY --from=build /app/apps/auth-service/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=5s --retries=6 --start-period=25s \
  CMD curl -fsS "http://127.0.0.1:3001/reference/openapi.json" >/dev/null || exit 1
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
