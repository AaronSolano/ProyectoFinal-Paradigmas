# Proposal: Game Service Quizzes and Storage

## Why

El servicio de juego (`game-service`) debe proporcionar a los docentes la capacidad de gestionar sus cuestionarios de evaluación rápida en formato Verdadero o Falso con soporte visual (imágenes de apoyo). Además, debe implementar la primera línea de defensa criptográfica validando que todo acceso HTTP contenga el claim de audiencia `aud: "profelink-game-api"` emitido por `auth-service`, respetando una estricta Arquitectura en Capas (Layers).

## What Changes

- **Servicio Autónomo NestJS (`apps/game-service`)**: Inicialización en el puerto `3002` con conexión exclusiva al esquema `game` de PostgreSQL y organización interna en capas: Presentación (Controllers/Guards/DTOs), Servicios (Business Logic), Persistencia (Prisma/Repositories) y Entidades.
- **Guard de Validación de Audiencia (`JwtAudienceGuard`)**: Interceptor de seguridad que inspecciona tokens Bearer y rechaza peticiones con HTTP 401 si la firma es inválida o el claim `aud` no es exactamente `"profelink-game-api"`.
- **CRUD de Cuestionarios y Preguntas V/F**: Endpoints `/api/quizzes` y `/api/quizzes/:id/questions` con validación de propiedad (`ownerId === user.sub`).
- **Módulo de Carga Multimedia (`/app/uploads`)**: Endpoint `/api/upload` con validación estricta de tipos MIME (`image/jpeg`, `image/png`, `image/webp`), tamaño límite ($\le 5\text{MB}$) y guardado con UUIDs en el volumen persistente Docker.
- **Documentación OpenAPI / Scalar**: Catálogo interactivo de la API disponible en `http://localhost:3002/reference`.

## Capabilities

### New Capabilities
- `quiz-management`: Administración completa de cuestionarios y preguntas V/F con control de autor y tiempos.
- `media-storage`: Carga multipart, validación y persistencia de imágenes en disco desacopladas del ciclo de vida del contenedor.
- `jwt-audience-guard`: Validación estricta de tokens JWT con verificación de audiencia requerida para protección de rutas.

### Modified Capabilities
<!-- None: Nueva funcionalidad de gestión de contenido de juego -->

## Impact

- **Código**: Crea la estructura base de `apps/game-service/` con arquitectura en capas.
- **Persistencia**: Genera tablas `quizzes` y `questions` en el esquema `game` de PostgreSQL.
- **Infraestructura**: Montaje del volumen persistente `quiz_images` en `/app/uploads` en `docker-compose.yml`.
