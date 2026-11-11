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

### 4. Una sola apertura por pregunta
- **Decisión**: `game:start_question` rechaza un `questionIndex` que ya fue abierto, esté la pregunta activa o cerrada, y no reinicia sus respuestas. Un índice nuevo sigue el avance secuencial y conserva el temporizador único de la sala. Si una respuesta ya está registrada para ese participante y esa pregunta, el motor la rechaza como duplicada y no suma puntos otra vez.
- **Racional**: reabrir el mismo índice vaciaba el conjunto de respondidos y permitía sumar un punto adicional.

### 5. El anfitrión no compite
- **Decisión**: `leaderboard` y `podium` excluyen al `hostId`. El anfitrión permanece en la lista de participantes con rol `HOST`. El resultado histórico aplica la misma exclusión al ordenar. No se agrega un cupo de participantes. Una sala de 200 estudiantes más el profesor queda para una prueba de carga posterior, en una base aislada.
- **Racional**: el profesor controla la partida. Incluirlo en la clasificación lo hacía competir, a menudo con puntaje cero.

## Risks / Trade-offs

- **[Riesgo: Fuga de memoria si una sala queda abandonada]** → **Mitigación**: Implementar mecanismo de auto-limpieza (expiración de sala tras 2 horas de inactividad).
- **[Riesgo: Respuestas concurrentes en el último milisegundo]** → **Mitigación**: Verificación atómica en `GameEngineService.submitAnswer` comparando `Date.now() <= session.questionExpiresAt`.
- **[Riesgo: 200 estudiantes no están medidos]** → **Mitigación**: no hay cupo artificial. La prueba de carga queda pendiente y no debe escribir en la base principal.
