---
title: "Infraestructura: Docker y Docker Compose"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - docker
  - docker-compose
  - infraestructura
  - despliegue
---

# 🐳 Infraestructura: Docker y Docker Compose

La reproducibilidad total del entorno de evaluación es un requisito obligatorio del curso. La totalidad del stack (base de datos, dos backends, dos frontends, recolector de telemetría y dashboard) se define y orquesta a través de **Docker Compose**.

---

## 📦 1. Catálogo de Servicios Contenerizados

| Servicio | Imagen / Build | Puerto Externo | Descripción |
| :--- | :--- | :--- | :--- |
| `postgres-db` | `postgres:16-alpine` | `5432:5432` | Base de datos relacional con volumen persistente `pgdata`. |
| `auth-service` | `Dockerfile` (NestJS) | `3001:3001` | API de autenticación y emisión de tokens con audiencia. |
| `game-service` | `Dockerfile` (NestJS) | `3002:3002` | API de quizzes, motor de WebSockets y volumen de imágenes. |
| `web-client` | `Dockerfile` (React + Nginx) | `5173:80` | Interfaz principal para el docente y los participantes. |
| `external-consumer` | `Dockerfile` (HTML/JS) | `5174:80` | Cliente web independiente para demostración de consumo externo. |
| `otel-collector` | `otel/opentelemetry-collector-contrib` | `4317, 4318` | Receptor OTLP de trazas y métricas de ambos backends. |
| `grafana` | `grafana/grafana:latest` | `3000:3000` | Visualizador de métricas de rendimiento y trazas de ejecución. |

---

## 📄 2. Definición de `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres-db:
    image: postgres:16-alpine
    container_name: profelink-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres123}
      POSTGRES_DB: ${DB_NAME:-profelink_db}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - profelink-net

  auth-service:
    build:
      context: .
      dockerfile: apps/auth-service/Dockerfile
    container_name: profelink-auth
    restart: on-failure
    depends_on:
      postgres-db:
        condition: service_healthy
    environment:
      PORT: 3001
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres123}@postgres-db:5432/${DB_NAME:-profelink_db}?schema=auth
      JWT_SECRET: ${JWT_SECRET:-super-secret-key-paradigmas-2026}
      JWT_AUDIENCE: profelink-game-api
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
    ports:
      - "3001:3001"
    networks:
      - profelink-net

  game-service:
    build:
      context: .
      dockerfile: apps/game-service/Dockerfile
    container_name: profelink-game
    restart: on-failure
    depends_on:
      postgres-db:
        condition: service_healthy
      auth-service:
        condition: service_started
    environment:
      PORT: 3002
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres123}@postgres-db:5432/${DB_NAME:-profelink_db}?schema=game
      JWT_SECRET: ${JWT_SECRET:-super-secret-key-paradigmas-2026}
      JWT_EXPECTED_AUDIENCE: profelink-game-api
      UPLOAD_DIR: /app/uploads
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
    ports:
      - "3002:3002"
    volumes:
      - quiz_images:/app/uploads
    networks:
      - profelink-net

  web-client:
    build:
      context: .
      dockerfile: apps/web-client/Dockerfile
    container_name: profelink-web
    restart: on-failure
    environment:
      VITE_AUTH_API_URL: http://localhost:3001
      VITE_GAME_API_URL: http://localhost:3002
      VITE_GAME_WS_URL: ws://localhost:3002
    ports:
      - "5173:80"
    networks:
      - profelink-net

  external-consumer:
    build:
      context: .
      dockerfile: apps/external-consumer/Dockerfile
    container_name: profelink-external-consumer
    restart: on-failure
    environment:
      VITE_AUTH_API_URL: http://localhost:3001
      VITE_GAME_API_URL: http://localhost:3002
    ports:
      - "5174:80"
    networks:
      - profelink-net

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: profelink-otel
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./infra/otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317" # OTLP gRPC
      - "4318:4318" # OTLP HTTP
    networks:
      - profelink-net

  grafana:
    image: grafana/grafana:latest
    container_name: profelink-grafana
    ports:
      - "3000:3000"
    volumes:
      - grafanadata:/var/lib/grafana
    networks:
      - profelink-net

volumes:
  pgdata:
    name: profelink_pgdata
  quiz_images:
    name: profelink_quiz_images
  grafanadata:
    name: profelink_grafanadata

networks:
  profelink-net:
    driver: bridge
```

---

## 💾 3. Prueba de Persistencia con Volúmenes

> [!important] Comprobación Obligatoria del Profesor
> Se evaluará que los datos persistan tras reiniciar los contenedores.

Para validar la persistencia:
```bash
# 1. Reiniciar completamente los contenedores
docker compose down
docker compose up -d

# 2. Verificar que los volúmenes siguen intactos
docker volume ls | grep profelink

# 3. Consultar vía REST o navegador: los cuestionarios creados y sus imágenes se preservan.
```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Variables de Entorno y Secretos|Variables de Entorno Requeridas]]
- [[Observabilidad (OTel y Grafana)|Configuración de Telemetría]]
- [[Script de Inicio y Seed|Automatización del Despliegue con start.sh]]
