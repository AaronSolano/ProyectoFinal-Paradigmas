---
title: "Variables de Entorno y Secretos"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - infraestructura
  - seguridad
  - variables-de-entorno
  - secretos
---

# 🔑 Variables de Entorno y Secretos

Este documento compila el catálogo exhaustivo de variables de configuración requeridas para levantar el ecosistema **ProfeLink - Evaluaciones en Vivo** tanto en desarrollo local como en contenedores Docker.

---

## 📋 1. Archivo `.env.example` Maestro

El repositorio debe proveer una plantilla `.env.example` que se replica automáticamente como `.env` durante la ejecución de los scripts de arranque:

```bash
# ========================================================
# 🐘 Persistencia: Base de Datos PostgreSQL
# ========================================================
DB_USER=postgres
DB_PASSWORD=SuperSecurePassword2026!
DB_NAME=profelink_db
DB_HOST=postgres-db
DB_PORT=5432

# URLs de conexión para Prisma / TypeORM
AUTH_DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=auth
GAME_DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=game

# ========================================================
# 🔐 Seguridad y Tokens JWT
# ========================================================
# Secreto compartido para firma y verificación simétrica HMAC-SHA256
JWT_SECRET=profelink-super-secret-key-paradigmas-eif400-2026
JWT_EXPIRES_IN=86400
JWT_ISSUER=profelink-auth-service
JWT_AUDIENCE=profelink-game-api

# ========================================================
# 🌐 Puertos y URLs de Servicios
# ========================================================
AUTH_PORT=3001
GAME_PORT=3002
WEB_PORT=5173
EXTERNAL_CONSUMER_PORT=5174
GRAFANA_PORT=3000

# URLs públicas expuestas a los navegadores
VITE_AUTH_API_URL=http://localhost:3001
VITE_GAME_API_URL=http://localhost:3002
VITE_GAME_WS_URL=ws://localhost:3002

# ========================================================
# 📁 Almacenamiento de Multimedia
# ========================================================
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=5

# ========================================================
# 📡 Observabilidad (OpenTelemetry + Grafana)
# ========================================================
OTEL_SERVICE_NAME_AUTH=profelink-auth-service
OTEL_SERVICE_NAME_GAME=profelink-game-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

---

## 🔒 2. Matriz de Variables por Servicio

| Variable | Servicio que la consume | Propósito | Valor Crítico / Ejemplo |
| :--- | :--- | :--- | :--- |
| `JWT_AUDIENCE` | `auth-service` | Inyecta el claim `aud` en cada token emitido. | `"profelink-game-api"` |
| `JWT_EXPECTED_AUDIENCE` | `game-service` | Guard verifica que el token contenga esta audiencia. | `"profelink-game-api"` |
| `JWT_SECRET` | Ambos backends | Clave criptográfica para firmar/validar el token. | Clave de alta entropía. |
| `UPLOAD_DIR` | `game-service` | Directorio montado en volumen para imágenes. | `/app/uploads` |
| `OTEL_EXPORTER_OTLP_ENDPOINT`| Ambos backends | Destino de exportación de métricas y trazas. | `http://otel-collector:4318` |

---

## ⚠️ 3. Recomendaciones de Seguridad para la Entrega
- **Nunca commitear el archivo `.env`:** Solo `.env.example` debe residir en el repositorio de Git.
- **Claves Fuertes:** Aunque sea un entorno de demostración académica, utilizar secretos robustos para evidenciar buenas prácticas.
- **Validación al Iniciar:** Ambos microservicios implementan validación estricta de variables de entorno al arrancar (usando `@nestjs/config` con Joi o Zod). Si falta una variable crítica, el proceso se aborta inmediatamente con un mensaje explícito.

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Docker y Compose|Configuración en Docker Compose]]
- [[Script de Inicio y Seed|Copia Automática de .env en Script de Inicio]]
- [[03 - Contratos y Especificaciones/Auth Service API (OpenAPI)|Claims JWT de Autenticación]]
