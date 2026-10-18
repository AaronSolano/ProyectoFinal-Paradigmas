## Context

La dinámica en vivo exige alta concurrencia y baja latencia. El backend debe sostener eventos síncronos y asegurar la integridad de las partidas en tiempo real. Véase `proposal.md` para motivación y contexto.

## Goals / Non-Goals

**Goals:**
- Implementar `GameGateway` usando Socket.io con validación JWT en el handshake.
- Gestionar salas activas con `InMemoryRoomStore` para acceso ultrarrápido ($O(1)$) a participantes y estados de ronda.
- Implementar las reglas de dominio puro de puntuación y anti-doble votación en `GameEngineService`.
- Soportar el ciclo completo de eventos: `room:join`, `game:start_question`, `game:submit_answer`, `game:close_question`, `game:finish`.
- Implementar `room:state_sync` para reconexión instantánea.
- Desarrollar pruebas automatizadas para las comprobaciones 2, 3 y 4 de la rúbrica.

**Non-Goals:**
- No incluye componentes visuales de frontend (cubierto en la Propuesta 5).
- No incluye exportación de métricas a OTel (cubierto en la Propuesta 6).

## Decisions

### 1. Motor de WebSockets: Socket.io sobre NestJS
- **Decisión**: Utilizar `@nestjs/platform-socket.io` y Socket.io v4.
- **Racional**: Provee soporte nativo para *rooms* (`socket.join(roomCode)`), reconexión automática en el cliente y serialización limpia de eventos.

### 2. Estado de Sala en Memoria (`InMemoryRoomStore`)
- **Decisión**: Mantener el estado en caliente de cada sala (`participants`, `currentQuestionIndex`, `answeredUsers: Set<string>`) en memoria RAM durante la partida, persistiendo en PostgreSQL solo al crear y finalizar la sesión.
- **Racional**: Garantiza tiempos de respuesta sub-milisegundo ante ráfagas masivas de respuestas estudiantiles simultáneas.

### 3. Árbitro de Tiempo en Servidor y Temporizadores
- **Decisión**: El servidor calcula `expiresAt = Date.now() + timeLimitSeconds * 1000` y programa un `setTimeout` interno para cerrar la pregunta si el host no lo hace manualmente antes.
- **Racional**: Elimina cualquier posibilidad de manipulación del reloj desde el cliente del alumno.

## Risks / Trade-offs

- **[Riesgo: Fuga de memoria si una sala queda abandonada]** → **Mitigación**: Implementar mecanismo de auto-limpieza (expiración de sala tras 2 horas de inactividad).
- **[Riesgo: Respuestas concurrentes en el último milisegundo]** → **Mitigación**: Verificación atómica en `GameEngineService.submitAnswer` comparando `Date.now() <= session.questionExpiresAt`.
