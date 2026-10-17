---
title: "Game Service API: Especificación OpenAPI / Scalar"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - api
  - openapi
  - scalar
  - game-service
  - rest
---

# 🎮 Game Service API: Especificación OpenAPI / Scalar

El microservicio `game-service` provee los endpoints REST para la administración de cuestionarios (CRUD), subida persistente de imágenes multimedia, apertura de sesiones de juego y consulta histórica de resultados para clientes internos y externos.

> [!info] Documentación Interactiva en Vivo
> - **Puerto por defecto:** `3002`
> - **Ruta Scalar UI:** `http://localhost:3002/reference`
> - **Ruta OpenAPI JSON:** `http://localhost:3002/api/docs-json`

---

## 🔒 1. Seguridad y Autorización
Todos los endpoints protegidos requieren el envío del header HTTP:
```http
Authorization: Bearer <JWT_EMITIDO_POR_AUTH_SERVICE>
```
El guard interno `JwtAudienceGuard` verifica:
1. Firma válida del JWT.
2. Token no expirado.
3. Claim `aud === "profelink-game-api"`.

---

## 📡 2. Catálogo de Endpoints REST

### 2.1 Cuestionarios (Quizzes)

#### `GET /api/quizzes`
Lista todos los cuestionarios creados por el usuario autenticado.
- **Seguridad:** Requiere JWT.
- **Respuesta `200 OK`:**
```json
[
  {
    "id": "e4f8a123-90bc-4d33-a1b2-8c9d0e1f2a3b",
    "title": "Evaluación: Paradigma Funcional",
    "description": "Preguntas de V/F sobre inmutabilidad y funciones puras.",
    "questionCount": 5,
    "createdAt": "2026-10-17T14:30:00.000Z"
  }
]
```

#### `POST /api/quizzes`
Crea un nuevo cuestionario.
- **Request Body:**
```json
{
  "title": "Evaluación: Concurrencia y Paralelismo",
  "description": "Conceptos de Hilos, Workers y Race Conditions"
}
```
- **Respuesta `201 Created`:** Retorna el objeto quiz con su `id` asignado.

#### `GET /api/quizzes/{id}`
Obtiene el detalle de un cuestionario con sus preguntas y URLs de imágenes.

#### `PUT /api/quizzes/{id}`
Actualiza título o descripción.
- **Regla:** Solo el propietario (`ownerId === user.sub`) puede editarlo. No se permite si el quiz está en una partida activa (`422 Unprocessable Entity`).

#### `DELETE /api/quizzes/{id}`
Elimina el cuestionario y sus preguntas en cascada.

---

### 2.2 Preguntas (Questions)

#### `POST /api/quizzes/{id}/questions`
Añade una pregunta de Verdadero o Falso al cuestionario.
- **Request Body:**
```json
{
  "statement": "¿En JavaScript, una función pura siempre retorna el mismo valor para los mismos argumentos y no tiene efectos secundarios?",
  "correctAnswer": true,
  "timeLimitSeconds": 30,
  "orderIndex": 1
}
```

#### `POST /api/quizzes/{id}/questions/{questionId}/image`
Sube una imagen ilustrativa para la pregunta.
- **Content-Type:** `multipart/form-data`
- **Campo:** `file` (archivo `.jpg`, `.png`, `.webp`, $\le 5\text{MB}$)
- **Respuesta `200 OK`:**
```json
{
  "imageUrl": "/uploads/questions/8f9a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c.png"
}
```

---

### 2.3 Sesiones de Juego (Game Sessions)

#### `POST /api/sessions`
Crea una nueva sala de juego para el cuestionario especificado.
- **Request Body:**
```json
{
  "quizId": "e4f8a123-90bc-4d33-a1b2-8c9d0e1f2a3b"
}
```
- **Respuesta `201 Created`:**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "roomCode": "PL-8492",
  "status": "WAITING",
  "wsEndpoint": "ws://localhost:3002"
}
```

#### `GET /api/sessions/code/{roomCode}`
Verifica si una sala existe y su estado para permitir el ingreso de participantes.
- **Respuesta `200 OK`:**
```json
{
  "exists": true,
  "status": "WAITING",
  "quizTitle": "Evaluación: Paradigma Funcional"
}
```

---

### 2.4 Consulta de Resultados (Uso Interno y Consumidor Externo)

#### `GET /api/sessions/{id}/results`
Retorna el podio final y las estadísticas de la partida finalizada.
- **Seguridad:** Requiere JWT con `aud: "profelink-game-api"`.
- **Respuesta `200 OK`:**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "roomCode": "PL-8492",
  "totalParticipants": 15,
  "totalQuestions": 5,
  "podium": [
    { "rank": 1, "displayName": "Carlos Rojas", "score": 5 },
    { "rank": 2, "displayName": "Ana Valverde", "score": 4 },
    { "rank": 3, "displayName": "Luis Mora", "score": 4 }
  ],
  "questionStats": [
    {
      "orderIndex": 1,
      "statement": "¿En JavaScript, una función pura...",
      "correctAnswer": true,
      "totalCorrect": 12,
      "totalIncorrect": 3
    }
  ]
}
```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Auth Service API (OpenAPI)|Ver Auth Service]]
- [[Eventos WebSockets (Socket.io)|Ver Especificación de WebSockets]]
- [[05 - Calidad y Pruebas/Casos de Prueba de Juego|Ver Casos de Prueba con Jest]]
