FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared-dtos ./packages/shared-dtos
COPY apps/game-service ./apps/game-service
RUN pnpm install --frozen-lockfile --filter @profelink/shared-dtos --filter @profelink/game-service \
  && pnpm --filter @profelink/shared-dtos build \
  && pnpm --filter @profelink/game-service prisma:generate \
  && pnpm --filter @profelink/game-service build \
  && pnpm --filter @profelink/game-service deploy --prod /out/game-service \
  && mkdir -p /out/game-service/node_modules/@profelink \
  && cp -r /app/apps/game-service/node_modules/@profelink/game-prisma /out/game-service/node_modules/@profelink/

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl curl
WORKDIR /app
ENV NODE_ENV=production
ENV GAME_PORT=3002
ENV UPLOAD_DIR=/app/uploads
COPY --from=build /out/game-service ./
COPY --from=build /app/apps/game-service/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh
EXPOSE 3002
HEALTHCHECK --interval=10s --timeout=5s --retries=6 --start-period=25s \
  CMD curl -fsS "http://127.0.0.1:3002/reference/openapi.json" >/dev/null || exit 1
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
