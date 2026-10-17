---
title: "Auth Service API: Especificación OpenAPI / Scalar"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - api
  - openapi
  - scalar
  - auth
  - jwt
---

# 🔐 Auth Service API: Especificación OpenAPI / Scalar

El microservicio `auth-service` se encarga de la gestión de identidades, registro, inicio de sesión y emisión de tokens JWT criptográficamente firmados con la audiencia requerida para el consumo seguro por parte de `game-service` y clientes externos.

> [!info] Documentación Interactiva en Vivo
> - **Puerto por defecto:** `3001`
> - **Ruta Scalar UI:** `http://localhost:3001/reference`
> - **Ruta OpenAPI JSON:** `http://localhost:3001/api/docs-json`

---

## 🔑 1. Estructura y Validación del Token JWT

El aspecto más crítico de la integración es la inclusión explícita del claim `aud` (Audience):

```json
{
  "sub": "b2f6c9d1-817a-4c22-9214-7e88382d5a3f",
  "email": "profe@profelink.cr",
  "username": "ProfeAlex",
  "role": "HOST",
  "aud": "profelink-game-api",
  "iss": "profelink-auth-service",
  "iat": 1792276800,
  "exp": 1792363200
}
```

- `sub`: Identificador UUID del usuario en la tabla `users`.
- `aud`: Debe ser estrictamente `"profelink-game-api"`. Cualquier token sin este valor será rechazado por `game-service`.
- `iss`: Identificador del emisor (`"profelink-auth-service"`).
- `exp`: Tiempo de expiración (24 horas por defecto).

---

## 📡 2. Catálogo de Endpoints REST

### 2.1 Registro de Usuario (`POST /api/auth/register`)
Crea una nueva cuenta de usuario (docente o estudiante).

- **Request Body:**
```json
{
  "email": "estudiante@profelink.cr",
  "password": "PasswordSeguro123!",
  "displayName": "María Alumna",
  "role": "PARTICIPANT"
}
```

- **Respuestas:**
  - `201 Created`: Usuario creado exitosamente.
  - `400 Bad Request`: Formato de email inválido o contraseña débil.
  - `409 Conflict`: El correo electrónico ya se encuentra registrado.

---

### 2.2 Inicio de Sesión (`POST /api/auth/login`)
Autentica credenciales y emite el JWT con `aud: "profelink-game-api"`.

- **Request Body:**
```json
{
  "email": "profe@profelink.cr",
  "password": "PasswordSeguro123!"
}
```

- **Respuesta `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": "b2f6c9d1-817a-4c22-9214-7e88382d5a3f",
    "email": "profe@profelink.cr",
    "displayName": "M.S. Alex Villegas",
    "role": "HOST"
  }
}
```
- **Respuesta `401 Unauthorized`:** Credenciales incorrectas.

---

### 2.3 Obtener Perfil Actual (`GET /api/auth/profile`)
Obtiene los datos del usuario a partir del token provisto en la cabecera.

- **Headers:**
  - `Authorization: Bearer <accessToken>`
- **Respuesta `200 OK`:**
```json
{
  "id": "b2f6c9d1-817a-4c22-9214-7e88382d5a3f",
  "email": "profe@profelink.cr",
  "displayName": "M.S. Alex Villegas",
  "role": "HOST",
  "createdAt": "2026-10-17T18:00:00.000Z"
}
```
- **Respuesta `401 Unauthorized`:** Token ausente, vencido o con firma alterada.

---

### 2.4 Verificación de Token para Terceros (`POST /api/auth/verify`)
Endpoint utilitario para que servicios externos o scripts validen un token sin necesidad de compartir el secreto simétrico.

- **Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Respuesta `200 OK`:**
```json
{
  "valid": true,
  "payload": {
    "sub": "b2f6c9d1-817a-4c22-9214-7e88382d5a3f",
    "aud": "profelink-game-api",
    "role": "HOST"
  }
}
```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Game Service API (OpenAPI)|Ver Endpoints de Game Service]]
- [[02 - Arquitectura y Diseno/Arquitectura del Sistema|Ver Arquitectura del Sistema]]
- [[04 - Infraestructura y Despliegue/Variables de Entorno y Secretos|Ver Configuración de Secretos JWT]]
