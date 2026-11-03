## Context

El ecosistema ProfeLink requiere desacoplamiento estricto entre el proveedor de identidades y el motor de juego. `auth-service` opera como emisor soberano de tokens de seguridad basados en estándares OAuth2/JWT. Véase `proposal.md` para el contexto y motivación.

## Goals / Non-Goals

**Goals:**
- Implementar la aplicación NestJS `apps/auth-service` en el puerto `3001`.
- Configurar Prisma Client apuntando exclusivamente a la base de datos PostgreSQL con parámetro de conexión `?schema=auth`.
- Desarrollar la autenticación con `@nestjs/jwt` y Passport, inyectando de forma estricta los claims `aud: "profelink-game-api"` e `iss: "profelink-auth-service"`.
- Montar la interfaz OpenAPI/Scalar en `/reference`.
- Crear el script de seed de usuarios para pruebas académicas.
- Desarrollar pruebas unitarias en Jest para el servicio de autenticación y hashing.

**Non-Goals:**
- No incluye refresh tokens complejos ni autenticación multifactor (fuera del alcance del curso).
- No gestiona cuestionarios ni conexiones de WebSocket (responsabilidad exclusiva de `game-service`).

## Decisions

### 1. Librería Criptográfica y Duración del Token
- **Decisión**: Emplear `bcrypt` para hashing de contraseñas y tokens JWT firmados con algoritmo HS256 y vigencia de 24 horas.
- **Racional**: Garantiza seguridad ante ataques de diccionario y evita que los alumnos sufran desconexiones de sesión durante una clase magistral de 2 a 3 horas.

### 2. Estructura Estricta de Claims JWT
- **Decisión**: El payload emitido en `/api/auth/login` incluye:
  ```json
  {
    "sub": "uuid-del-usuario",
    "email": "profe@profelink.cr",
    "displayName": "Profesor Alex",
    "role": "HOST",
    "iss": "profelink-auth-service",
    "aud": "profelink-game-api"
  }
  ```
- **Racional**: Responde directamente a la comprobación de rúbrica del profesor que exige validar el claim `aud` en servicios receptores.

### 3. Documentador de API: Scalar sobre OpenAPI
- **Decisión**: Usar `@scalar/nestjs-api-reference` en `/reference`.
- **Racional**: Ofrece un explorador de API visualmente más moderno, rápido y legible que Swagger UI tradicional, facilitando la calificación interactiva en la defensa.

## Risks / Trade-offs

- **[Riesgo: Sincronización de clave secreta JWT entre servicios]** → **Mitigación**: Definir `JWT_SECRET` compartido en `.env.example` y consumido por ambos contenedores mediante variables de entorno en Docker Compose.
- **[Riesgo: Exposición accidental del hash de contraseña]** → **Mitigación**: Uso de interceptores de clase (`ClassSerializerInterceptor`) o DTOs de salida limpios que excluyen explícitamente `password_hash`.
