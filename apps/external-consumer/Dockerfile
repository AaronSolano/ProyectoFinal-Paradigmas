FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ARG VITE_AUTH_API_URL=http://localhost:3001
ARG VITE_GAME_API_URL=http://localhost:3002
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL \
    VITE_GAME_API_URL=$VITE_GAME_API_URL
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/external-consumer ./apps/external-consumer
RUN pnpm install --frozen-lockfile --filter @profelink/external-consumer \
  && pnpm --filter @profelink/external-consumer build

FROM nginx:1.27-alpine AS runner
COPY apps/external-consumer/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/external-consumer/dist /usr/share/nginx/html
EXPOSE 5174
HEALTHCHECK --interval=10s --timeout=5s --retries=6 --start-period=5s \
  CMD wget -qO- http://127.0.0.1:5174/ >/dev/null || exit 1