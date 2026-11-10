## Context

El repositorio carece actualmente de estructura de código ejecutable, configuración de compilación y orquestación de servicios. Para soportar el ecosistema de microservicios autónomos exigido en el curso EIF400, este diseño establece las bases operativas y estructurales previas al desarrollo de `auth-service` y `game-service`. Véase `proposal.md` para la justificación y motivación.

## Goals / Non-Goals

**Goals:**
- Configurar un monorepo modular con `pnpm workspaces` gestionando los directorios `apps/` y `packages/`.
- Crear el paquete `@profelink/shared-dtos` bajo `packages/shared-dtos` con soporte de compilación TypeScript y generación de tipos `.d.ts`.
- Configurar `docker-compose.yml` para PostgreSQL 16 con creación automática de los esquemas `auth` y `game` mediante script de inicialización (`init-schemas.sql`).
- Definir volúmenes persistentes nombrados (`pgdata` y `quiz_images`) para garantizar la persistencia de datos e imágenes ante reinicios de contenedor.
- Crear una plantilla estandarizada `.env.example` y scripts de arranque automatizados reproducibles (`start.sh` y `start.ps1`).

**Non-Goals:**
- No incluye la implementación de la lógica de autenticación ni endpoints de `auth-service` (cubierto en la Propuesta 2).
- No incluye la implementación de los servicios de cuestionarios ni WebSockets de `game-service` (cubiertos en las Propuestas 3 y 4).
- No incluye la interfaz de usuario en React ni el cliente externo (cubiertos en la Propuesta 5).
- No incluye la orquestación de Grafana/OpenTelemetry Collector (cubierto en la Propuesta 6).

## Decisions

### 1. Gestor de Monorepo: `pnpm workspaces`
- **Decisión**: Utilizar `pnpm` como gestor de paquetes con el protocolo `workspace:*`.
- **Racional**: `pnpm` evita la duplicación de dependencias mediante enlaces duros, impide la fuga de dependencias fantasma (a diferencia de npm plano) y ofrece compatibilidad fluida con NestJS y Vite.
- **Alternativas consideradas**:
  - *npm workspaces*: Tiende a generar conflictos de hoisting y resolución de dependencias duplicadas.
  - *Lerna / Nx*: Sobrecarga innecesaria para un proyecto académico de 4 aplicaciones y 1 paquete compartido.

### 2. Persistencia en Base de Datos: Instancia Única de PostgreSQL con Dos Esquemas Aislados
- **Decisión**: Levantar una sola instancia de PostgreSQL 16 que aprovisiona automáticamente los esquemas `auth` y `game` mediante un script montado en `/docker-entrypoint-initdb.d/init-schemas.sql`.
- **Racional**: Cumple con el desacoplamiento estricto de Bounded Contexts requerido por el profesor (las conexiones de `auth-service` se restringen a `schema=auth` y las de `game-service` a `schema=game`), minimizando el consumo de memoria RAM en la máquina de desarrollo y evitando conflictos de puertos.
- **Alternativas consideradas**:
  - *Dos contenedores PostgreSQL independientes*: Consumiría el doble de recursos de hardware sin aportar valor pedagógico adicional.

### 3. Compilación de `@profelink/shared-dtos`: Empaquetado Dual (CJS/ESM)
- **Decisión**: Configurar la compilación del paquete compartido utilizando TypeScript (`tsc`) o `tsup` generando tanto CommonJS (requerido por defecto en NestJS) como ESM (utilizado por Vite en el frontend).
- **Racional**: Previene incompatibilidades habituales de módulos entre el runtime de Node.js (NestJS) y el empaquetador del navegador (Vite).
- **Alternativas consideradas**:
  - *Consumo directo de fuentes `.ts`*: Provoca fallos en compiladores que no procesan archivos fuera del `rootDir` de cada aplicación.

### 4. Automatización de Arranque Multiplataforma (`start.sh` y `start.ps1`)
- **Decisión**: Proveer tanto un script bash (`start.sh`) como un script PowerShell (`start.ps1`).
- **Racional**: Asegura la evaluación en un solo comando sin importar si el profesor o el estudiante ejecutan Windows, Linux o macOS.
- **Alternativas consideradas**:
  - *Solo `start.sh`*: Obligaría a usuarios de Windows a usar Git Bash o WSL.

## Risks / Trade-offs

- **[Riesgo: Conflicto de puerto 5432 si el host ya tiene PostgreSQL instalado]** → **Mitigación**: Exponer `POSTGRES_PORT` configurable en `.env` (con valor predeterminado 5432).
- **[Riesgo: Persistencia de imágenes en desarrollo]** → **Mitigación**: Montar el volumen nombrado `quiz_images` en la ruta `/app/uploads` en `docker-compose.yml` para desacoplar el ciclo de vida de los archivos multimedia del ciclo de vida del contenedor.
- **[Riesgo: Orden de inicialización de contenedores]** → **Mitigación**: Incluir directiva `healthcheck` en el servicio `postgres-db` usando `pg_isready` para que los futuros servicios esperen la disponibilidad de la base de datos con `condition: service_healthy`.
