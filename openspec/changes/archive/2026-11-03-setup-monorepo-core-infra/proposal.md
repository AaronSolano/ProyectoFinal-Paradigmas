# Proposal: Setup Monorepo and Core Infrastructure

## Why

El proyecto final de Paradigmas de Programación (*ProfeLink - Evaluaciones en Vivo*) exige una arquitectura distribuida de microservicios autónomos con estricta reproducibilidad local, persistencia garantizada en Docker Compose y tipado compartido entre clientes y backends. Actualmente el repositorio no cuenta con estructura de código ni orquestación de servicios; implementar esta infraestructura base ahora es indispensable para desbloquear el desarrollo desacoplado de `auth-service`, `game-service` y los clientes web.

## What Changes

- **Monorepo Workspaces (`pnpm`)**: Configuración raíz con `pnpm-workspace.yaml`, scripts maestros (`build`, `dev`, `lint`, `test`), configuraciones compartidas de TypeScript (`tsconfig.base.json`) y ESLint/Prettier.
- **Paquete de Contratos Compartidos (`packages/shared-dtos`)**: Definición de tipos fundamentales del dominio, enumeraciones (`SessionStatus`, `UserRole`), interfaces de eventos y DTOs comunes.
- **Orquestación de Infraestructura (`docker-compose.yml`)**: Definición del contenedor de base de datos PostgreSQL 16 con creación de esquemas aislados (`auth` y `game`), volúmenes persistentes nombrados (`pgdata` y `quiz_images` para `/app/uploads`), y redes internas (`profelink-net`).
- **Variables de Entorno y Secretos**: Creación de archivo `.env.example` tipificado y documentado para todos los servicios del ecosistema.
- **Script de Automatización (`start.sh` y `start.ps1`)**: Script reproducible en un solo comando que verifica requisitos (Docker, Node, pnpm), levanta la base de datos, valida el healthcheck y prepara el entorno para migraciones y seeds.

## Capabilities

### New Capabilities
- `core-infrastructure`: Orquestación multi-contenedor con Docker Compose, persistencia en volúmenes (`pgdata`, `quiz_images`), aislamiento de esquemas PostgreSQL (`auth` y `game`), configuración de variables de entorno y script de inicio unificado (`start.sh`/`start.ps1`).
- `shared-contracts`: Paquete centralizado en TypeScript (`packages/shared-dtos`) con enumeraciones de negocio, contratos de eventos WebSockets, DTOs compartidos y configuración de compilación para el monorepo.

### Modified Capabilities
<!-- None: Este es el cambio inicial de infraestructura en un repositorio limpio. -->

## Impact

- **Código y Estructura**: Crea la raíz de directorios `apps/` y `packages/` gestionada por `pnpm`.
- **Infraestructura**: Puertos locales reservados (PostgreSQL en `5432`, preparación para servicios en `3001`, `3002`, `5173`, `5174`).
- **Dependencias**: Node.js >= 20, pnpm >= 9, Docker & Docker Compose v2.
