---
title: "Guión de Demostración en Clase y Banco de Respuestas"
parent: "[[00 - MOC ProfeLink]]"
course: "EIF400 - Paradigmas de Programación"
professor: "M.S. Alex Villegas Carranza"
weight: "30% (40 pts)"
tags:
  - defensa
  - presentacion
  - preguntas-examen
  - guion
---

# 🎙️ Guión de Demostración en Clase y Banco de Respuestas

Este guión paso a paso está diseñado para conducir la demostración en vivo de 10-15 minutos ante el profesor M.S. Alex Villegas, optimizando el tiempo y cubriendo todos los puntos de la rúbrica.

---

## ⏱️ Minuto a Minuto de la Presentación

```mermaid
timeline
    title Flujo de Demostración en Vivo (12 Minutos)
    00:00 - 02:00 : 1. Introducción y Arquitectura : Contexto pedagógico, microservicios y Arquitectura en Layers
    02:00 - 04:00 : 2. Arranque y Despliegue : Demostración de ./start.sh y verificación de contenedores
    04:00 - 07:00 : 3. Partida en Vivo : Host proyecta, 2 alumnos se unen por móvil/navegador, responden V/F
    07:00 - 08:30 : 4. Caso Crítico : Demostración de reconexión (F5) y anti-doble votación
    08:30 - 10:00 : 5. Consumo Externo y OTel : Cliente independiente (5174) y Dashboard en Grafana
    10:00 - 12:00 : 6. Pruebas Automatizadas : Ejecución de 'pnpm test' y preguntas del profesor
```

---

## 🎬 Paso a Paso Detallado

### Paso 1: Introducción y Justificación Arquitectónica (2 min)
- *"Profesor, nuestro proyecto resuelve la necesidad de evaluaciones rápidas formativas en tiempo real para ProfeLink."*
- *"Adoptamos una arquitectura de **Servicios Autónomos**: `auth-service` emite identidades en el puerto 3001 con claim `aud: 'profelink-game-api'`, y `game-service` en el puerto 3002 gestiona el motor de juego en tiempo real con WebSockets."*
- *"A nivel interno, aplicamos **Arquitectura en Capas (Layered Architecture - Layers)** en NestJS (Presentación, Servicios/Negocio y Acceso a Datos), logrando que las reglas de negocio (puntuaciones y tiempos) residan en servicios especializados y se evalúen en milisegundos con Jest."*

### Paso 2: Reproducibilidad y Arranque Automático (2 min)
- Abrir una terminal limpia y ejecutar:
  ```bash
  ./start.sh
  ```
- Mostrar que en una sola instrucción:
  - Se levantan los 7 contenedores en Docker.
  - Se corren las migraciones de base de datos.
  - Se cargan los datos semilla (*seed* con usuario docente y quiz de prueba).

### Paso 3: Demostración de la Partida en Vivo (3 min)
1. Abrir ventana de navegador en `http://localhost:5173` e ingresar como docente (`profe@profelink.cr`).
2. Abrir sala de juego: se proyecta el PIN (ej. `PL-8492`).
3. Abrir dos ventanas en modo incógnito/móvil:
   - Alumno 1 (María) ingresa PIN y se une.
   - Alumno 2 (Carlos) ingresa PIN y se une.
4. Mostrar en el proyector cómo el Lobby se actualiza reactivamente por WebSockets.
5. Iniciar la pregunta 1:
   - Mostrar la imagen cargada y el temporizador sincronizado.
   - Resaltar que el payload del socket `game:question_opened` **no contiene la respuesta correcta**.
   - María presiona Verdadero; Carlos presiona Falso.
6. Cerrar pregunta: se revela la respuesta correcta y las estadísticas de la clase.

### Paso 4: Comprobación de Reconexión y Anti-Doble Votación (1.5 min)
1. Durante la pregunta 2, recargar la página del Alumno 1 (F5):
   - Alumno 1 vuelve a entrar de inmediato a la misma pregunta sin perder sus puntos acumulados.
   - En la vista del docente, el conteo de alumnos sigue siendo 2 (no se duplica).
2. Intentar pulsar el botón de respuesta repetidamente: el sistema solo procesa el primer clic.

### Paso 5: Consumo Externo y Observabilidad (1.5 min)
1. Abrir `http://localhost:5174` (Cliente Externo):
   - Iniciar sesión y consultar los resultados consolidados de la partida recién concluida.
   - Mostrar que consume el API de juego a través de contratos documentados en **Scalar** (`/reference`).
2. Abrir Grafana en `http://localhost:3000`:
   - Mostrar el gráfico de conexiones activas de WebSockets y la traza distribuida en **OpenTelemetry**.

### Paso 6: Ejecución de Pruebas Automatizadas (2 min)
- Ejecutar en la terminal:
  ```bash
  pnpm test
  ```
- Mostrar todas las pruebas en verde (incluyendo `concurrent-rooms`, `permissions`, `reconnection` y `answer-validation`).

---

## 🧠 Banco de Respuestas a Preguntas Clave del Profesor

> [!question] Pregunta 1: "¿Por qué utilizaron el claim `aud` en el JWT y qué sucede si un atacante envía un token válido de otro sistema?"
> **Respuesta:**
> *"El claim `aud` (audience) garantiza que el token fue emitido específicamente para ser consumido por el API de juego (`profelink-game-api`). Si un atacante presenta un token válido firmado por el mismo u otro emisor pero con una audiencia distinta (o sin claim `aud`), nuestro guard `JwtAudienceGuard` lo rechaza de inmediato con un HTTP 401 Unauthorized antes de tocar cualquier lógica de negocio o socket."*

> [!question] Pregunta 2: "¿Cómo evitan que dos salas simultáneas mezclen mensajes o participantes?"
> **Respuesta:**
> *"Utilizamos el mecanismo de **Rooms** nativo de Socket.io. Al recibir el evento `room:join`, asociamos el socket únicamente a la sala identificada por su `roomCode`. Cuando el docente lanza una pregunta o cierra una ronda, la emisión se hace con `this.server.to(roomCode).emit(...)`. Además, en el dominio, el estado de cada partida se gestiona en instancias de `GameSession` completamente aisladas en memoria y en base de datos."*

> [!question] Pregunta 3: "¿Dónde reside la regla de que las respuestas tardías no valen puntos y cómo se probó?"
> **Respuesta:**
> *"Reside en la entidad pura `GameSession` dentro de la Capa de Dominio (`src/domain/entities/game-session.entity.ts`). La entidad compara el timestamp oficial del servidor con `this.questionExpiresAt`. Si el tiempo expiró, lanza `AnswerTimeExpiredException` y asigna 0 puntos. Esta regla está cubierta por la prueba unitaria `GameSession.spec.ts`, la cual se ejecuta con Jest en menos de 5 milisegundos sin requerir base de datos ni sockets."*

> [!question] Pregunta 4: "¿Qué ventajas aporta la Arquitectura en Layers frente a colocar la lógica directamente en los Gateways de NestJS?"
> **Respuesta:**
> *"Permite una separación rigurosa de responsabilidades (SoC). La Capa de Presentación (Gateways y Controladores) solo valida formatos de entrada y delega a la Capa de Servicios (`GameEngineService`, `GameSessionService`). Esto evita acoplar las reglas de puntuación o temporizadores al protocolo de transporte WebSockets, facilitando un testing unitario ultrarrápido y modular con Jest aislando dependencias mediante inyección."*

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Checklist de Verificacion|Ver Checklist de Evaluación]]
- [[05 - Calidad y Pruebas/Casos de Prueba de Juego|Ver Casos de Prueba con Jest]]
- [[04 - Infraestructura y Despliegue/Script de Inicio y Seed|Ver Script start.sh]]
