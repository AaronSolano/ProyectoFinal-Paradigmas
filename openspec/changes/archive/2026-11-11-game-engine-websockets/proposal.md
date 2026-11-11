# Proposal: Game Engine and WebSockets Realtime

## Why

El núcleo pedagógico de ProfeLink es la dinámica evaluativa sincrónica en tiempo real tipo Kahoot (Verdadero/Falso). Se requiere un motor de WebSockets altamente confiable que aísle rigurosamente las salas de clase, garantice la equidad de las respuestas (servidor como árbitro temporal, anti-doble voto, respuesta correcta oculta hasta el cierre) y permita reconexiones transparentes de los estudiantes sin perder su puntaje ni duplicarse en el lobby.

## What Changes

- **Gateway de WebSockets (`GameGateway`)**: Implementación en Socket.io sobre `game-service` (puerto 3002) con autenticación JWT en el handshake.
- **Gestor de Salas Volátiles (`InMemoryRoomStore` y `RoomManagerService`)**: Generación de códigos PIN de 6 caracteres (`roomCode`), control de estados (`WAITING`, `QUESTION_ACTIVE`, `QUESTION_CLOSED`, `FINISHED`) y aislamiento total de namespaces/rooms.
- **Protocolo de Eventos en Tiempo Real**:
  - `room:join`, `room:participant_joined`, `room:state_sync`
  - `game:start_question`, `game:question_opened` (ocultando `correctAnswer`), `game:submit_answer`, `game:answer_ack`
  - `game:close_question`, `game:question_results` (revelando `correctAnswer`, conteos y leaderboard parcial)
  - `game:finish` (emisión de podio y consolidación en PostgreSQL)
- **Motor de Reglas de Dominio Puro**:
  - Anti-doble votación con `Set<userId>` por pregunta.
  - Validación de tiempo estricta en servidor (`now <= expiresAt`).
  - Reconexión tolerante a fallas con reasignación de socket y emisión privada de estado actual.
- **Pruebas Automatizadas de Comprobaciones de Rúbrica**:
  - Comprobación 2: Aislamiento concurrente de salas (`concurrent-rooms.e2e-spec.ts`).
  - Comprobación 3: Validación de respuestas y tiempos (`answer-validation.spec.ts`).
  - Comprobación 4: Reconexión sin duplicidad (`reconnection.spec.ts`).

## Capabilities

### New Capabilities
- `realtime-game-engine`: Servidor WebSocket Socket.io para orquestación de salas, control de anfitrión y transiciones de estado.
- `game-rules-scoring`: Reglas puras de puntuación, anti-doble votación y validación de expiración de preguntas.
- `participant-reconnection`: Recuperación de estado sincrónico y reconexión no destructiva de jugadores.

### Modified Capabilities
<!-- None: Nueva funcionalidad de tiempo real -->

## Impact

- **Código**: Agrega gateways, servicios de sala, filtros de excepciones de WebSocket y entidades en memoria a `apps/game-service`.
- **Persistencia**: Registra partidas terminadas y respuestas en `game_sessions`, `session_participants` y `participant_answers`.
