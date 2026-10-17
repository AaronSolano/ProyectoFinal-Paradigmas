---
title: "Eventos WebSockets: Protocolo en Tiempo Real (Socket.io)"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - websockets
  - socket-io
  - tiempo-real
  - contratos
---

# ⚡ Eventos WebSockets: Protocolo en Tiempo Real (Socket.io)

La interacción en vivo entre el docente (anfitrión) y los estudiantes (participantes) se gestiona a través de una conexión persistente bidireccional usando **Socket.io** sobre `game-service` (Puerto `3002`).

---

## 🔒 1. Handshake y Autenticación del Socket

Al inicializar la conexión, el cliente debe proveer el token JWT en el objeto de autenticación del handshake:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  transports: ['websocket']
});
```

El servidor valida que el token sea auténtico y contenga el claim `aud: "profelink-game-api"`. Si la validación falla, la conexión se rechaza con un error de autorización.

---

## 📋 2. Diccionario Completo de Eventos

| Evento | Dirección | Emisor | Payload Principal | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `room:join` | Cliente $\rightarrow$ Servidor | Host / Player | `{ roomCode: string }` | Suscribe el socket al room de Socket.io. Si el usuario ya existía, ejecuta **reconexión**. |
| `room:state_sync` | Servidor $\rightarrow$ Cliente | Servidor | `{ status, currentQuestion, score, hasAnswered }` | Emisión privada al cliente reconectado para restaurar su estado visual exacto. |
| `room:participant_joined` | Servidor $\rightarrow$ Sala | Servidor | `{ participants: ParticipantView[] }` | Actualiza la lista de jugadores conectados en la vista del lobby. |
| `game:start_question` | Cliente $\rightarrow$ Servidor | Anfitrión | `{ roomCode: string, questionIndex: number }` | El host abre una pregunta e inicializa el timer en el servidor. |
| `game:question_opened` | Servidor $\rightarrow$ Sala | Servidor | `{ questionId, statement, imageUrl, timeLimit, expiresAt }` | Proyecta la pregunta a todos (**sin el campo `correctAnswer`**). |
| `game:submit_answer` | Cliente $\rightarrow$ Servidor | Jugador | `{ roomCode, questionId, answer: boolean }` | Envío de respuesta binaria (`true`/`false`). |
| `game:answer_ack` | Servidor $\rightarrow$ Jugador | Servidor | `{ success: boolean, message?: string }` | Confirmación privada de recepción de respuesta. |
| `game:close_question` | Cliente $\rightarrow$ Servidor / Auto | Host / Timer | `{ roomCode: string }` | Cierra la ventana de recepción de respuestas de la ronda. |
| `game:question_results` | Servidor $\rightarrow$ Sala | Servidor | `{ correctAnswer: boolean, stats, leaderboard }` | Revela si era V o F, estadísticas globales y tabla parcial. |
| `game:finish` | Cliente $\rightarrow$ Servidor | Anfitrión | `{ roomCode: string }` | Finaliza la partida, persiste en BD y envía el podio final. |

---

## 🔄 3. Diagramas de Secuencia

### 3.1 Flujo de una Ronda de Pregunta

```mermaid
sequenceDiagram
    autonumber
    actor Host as Anfitrión (Profesor)
    participant Server as Game Gateway (Socket.io)
    actor Player as Estudiante (Jugador)

    Host->>Server: game:start_question { roomCode, questionIndex: 0 }
    Note over Server: Valida hostId.<br/>Inicia temporizador servidor.<br/>Oculta 'correctAnswer'.
    Server-->>Host: game:question_opened { id, statement, imageUrl, expiresAt }
    Server-->>Player: game:question_opened { id, statement, imageUrl, expiresAt }

    Note over Player: Muestra texto, imagen y botones: [VERDADERO] [FALSO]
    Player->>Server: game:submit_answer { roomCode, questionId, answer: true }
    Note over Server: Valida:<br/>1. now <= expiresAt<br/>2. No votó antes
    Server-->>Player: game:answer_ack { success: true }

    alt Tiempo expira o Host presiona 'Cerrar'
        Host->>Server: game:close_question { roomCode }
        Note over Server: Cambia estado a QUESTION_CLOSED.<br/>Calcula estadísticas de aciertos/fallos.<br/>Actualiza Leaderboard.
        Server-->>Host: game:question_results { correctAnswer: true, stats, leaderboard }
        Server-->>Player: game:question_results { correctAnswer: true, stats, leaderboard }
    end
```

---

### 3.2 Flujo de Reconexión de Participante

```mermaid
sequenceDiagram
    autonumber
    actor Player as Estudiante Reconectado
    participant Server as Game Gateway (Socket.io)

    Note over Player: Pierde conexión WiFi o recarga F5.<br/>El socket previo se desconecta.
    Player->>Server: Conexión nueva con JWT
    Player->>Server: room:join { roomCode: "PL-8492" }
    Note over Server: Busca en sesión activa por userId.<br/>Encuentra registro existente.<br/>Actualiza socket.id.<br/>No incrementa contador de jugadores.
    Server-->>Player: room:state_sync {<br/>  status: "QUESTION_ACTIVE",<br/>  currentQuestion: {...},<br/>  remainingSeconds: 14,<br/>  hasAnswered: true,<br/>  totalScore: 2<br/>}
    Note over Player: Restaura pantalla de espera con su puntaje previo intacto.
```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Game Service API (OpenAPI)|Ver APIs REST de Game Service]]
- [[01 - Requerimientos y Alcance/Reglas del Juego y Negocio|Reglas de Juego y Tiempos]]
- [[05 - Calidad y Pruebas/Casos de Prueba de Juego|Pruebas de WebSockets con Jest]]
