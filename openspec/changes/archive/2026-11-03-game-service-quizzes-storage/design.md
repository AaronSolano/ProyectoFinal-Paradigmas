## Context

`game-service` es el microservicio central encargado del ciclo de vida del contenido evaluativo y la persistencia multimedia. Adopta una estricta **Arquitectura en Capas (Layered Architecture - Layers)** en NestJS para asegurar desacoplamiento y testabilidad. Véase `proposal.md` para motivación.

## Goals / Non-Goals

**Goals:**
- Estructurar `apps/game-service` con capas explícitas: Presentation, Business Logic/Services, Data Access/Repositories, Entities.
- Configurar Prisma Client apuntando al esquema `game` de PostgreSQL.
- Implementar `JwtAudienceGuard` validando rigurosamente `aud: "profelink-game-api"`.
- Implementar CRUD de Quizzes y Questions con validaciones de tiempo y autor.
- Implementar subida y almacenamiento de imágenes en `/app/uploads` con validación de tipo y tamaño.
- Exponer documentación interactiva Scalar en `/reference`.

**Non-Goals:**
- No incluye el motor de sockets en tiempo real ni la gestión del lobby (cubierto en la Propuesta 4).
- No emite tokens de autenticación (responsabilidad de `auth-service`).

## Decisions

### 1. Organización en Capas (Layers)
- **Decisión**: Estructurar el código en 4 capas concéntricas:
  - `presentation/`: Controllers, Guards, DTOs de entrada/salida.
  - `services/`: Lógica de negocio (reglas de autoría, inmutabilidad).
  - `persistence/`: Repositorios y cliente Prisma.
  - `entities/`: Modelos de dominio y enums.
- **Racional**: Responde directamente a las preguntas de defensa del profesor sobre Clean Architecture y separación de responsabilidades.

### 2. Validación Estricta de Audiencia (`JwtAudienceGuard`)
- **Decisión**: Configurar Passport JWT con `audience: 'profelink-game-api'` e `issuer: 'profelink-auth-service'`.
- **Racional**: Satisface la Comprobación 1 de la rúbrica donde se audita el rechazo de tokens emitidos para otros propósitos o sin audiencia.

### 3. Persistencia de Medios con UUID
- **Decisión**: Los archivos recibidos se renuevan con nombre `uuidv4() + extension` y se sirven estáticamente desde el prefijo `/uploads/`.
- **Racional**: Evita colisiones de nombres y previene ataques de inyección de rutas (path traversal).

## Risks / Trade-offs

- **[Riesgo: Borrado accidental de imágenes al reconstruir contenedores]** → **Mitigación**: Montaje del volumen Docker persistente `quiz_images` en la ruta `/app/uploads`.
- **[Riesgo: Consultas de preguntas no autorizadas]** → **Mitigación**: Filtrar por `ownerId` en la capa de servicios al ejecutar operaciones de modificación o borrado.
