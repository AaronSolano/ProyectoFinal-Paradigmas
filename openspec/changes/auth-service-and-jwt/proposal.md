# Proposal: Auth Service and JWT Audience

## Why

El proyecto requiere que la emisión de identidades esté desacoplada de la lógica de evaluación en un servicio autónomo (`auth-service`), el cual debe certificar la confianza entre microservicios mediante el claim de audiencia JWT (`aud: "profelink-game-api"`). Sin este servicio, ni `game-service` ni los clientes web pueden autenticar usuarios ni verificar permisos de forma segura.

## What Changes

- **Servicio Autónomo NestJS (`apps/auth-service`)**: Inicialización de la aplicación NestJS en el puerto `3001` con conexión exclusiva al esquema `auth` de PostgreSQL mediante Prisma ORM.
- **Modelo de Datos de Identidad (`users`)**: Persistencia de usuarios con UUID, email único, hash seguro de contraseña (bcrypt), nombre visible y roles (`HOST` o `PARTICIPANT`).
- **Autenticación y Emisión de JWT**: Endpoints `/api/auth/register` y `/api/auth/login` que emiten tokens firmados conteniendo los claims obligatorios: `sub` (userId), `email`, `displayName`, `role`, `iss` (`"profelink-auth-service"`) y `aud` (`"profelink-game-api"`).
- **Semilla de Usuarios (Seed)**: Precarga automática de credenciales de prueba (`profe@profelink.cr` como HOST y `alumno@profelink.cr` como PARTICIPANT).
- **Documentación Interactiva Scalar / OpenAPI**: Exposición interactiva de la API en la ruta `/reference`.
- **Dockerización**: `Dockerfile` optimizado para `auth-service` listo para orquestación.

## Capabilities

### New Capabilities
- `user-authentication`: Gestión de usuarios, registro, login y generación criptográfica de tokens JWT con claim `aud: "profelink-game-api"`.
- `api-documentation-auth`: Contrato interactivo OpenAPI con documentación Scalar en `/reference` para el servicio de autenticación.

### Modified Capabilities
<!-- None: Nueva funcionalidad de identidad -->

## Impact

- **Código**: Crea `apps/auth-service/` con módulos de autenticación, usuarios, Prisma y configuración.
- **Persistencia**: Genera migraciones en el esquema `auth` de PostgreSQL.
- **Red y Puertos**: Expone el puerto `3001` para clientes web e integradores externos.
