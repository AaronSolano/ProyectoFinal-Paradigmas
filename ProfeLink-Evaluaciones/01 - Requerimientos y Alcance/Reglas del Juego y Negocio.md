---
title: "Reglas del Juego y del Negocio: ProfeLink Evaluaciones"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - reglas-de-negocio
  - requerimientos
  - arquitectura/dominio
---

# ⚖️ Reglas del Juego y del Negocio

Este documento compila las directrices matemáticas, lógicas y operativas que rigen el comportamiento del sistema. Estas reglas constituyen el núcleo del **Dominio Puro** y deben validarse rigurosamente mediante pruebas unitarias en **Jest**.

---

## 🧮 1. Sistema de Puntuación (Scoring Rule)

Cada pregunta admite una única evaluación binaria. No existen puntos fraccionarios ni penalizaciones por respuestas erróneas.

### Fórmula Formal de Puntuación
$$\text{Puntaje}(\text{participante}, \text{pregunta}) = \begin{cases} 
1 & \text{si } \text{respuesta} = \text{correctAnswer} \quad \land \quad t_{\text{llegada}} \le t_{\text{expiración}} \\ 
0 & \text{si } \text{respuesta} \ne \text{correctAnswer} \quad \lor \quad t_{\text{llegada}} > t_{\text{expiración}} \quad \lor \quad \text{sin respuesta}
\end{cases}$$

- **Tiempo de Servidor:** La validación temporal se calcula exclusivamente en el servidor usando `Date.now()`. Los relojes del cliente no se utilizan para determinar si una respuesta llegó a tiempo.
- **Acumulador de Sala:** El puntaje total de un participante es la sumatoria de puntos obtenidos en las preguntas completadas:
  $$\text{TotalScore}(u) = \sum_{i=1}^{N} \text{Puntaje}(u, q_i)$$

---

## 🛡️ 2. Reglas de Integridad y Concurrencia

### Regla 2.1: Idempotencia y Anti-Doble Votación (Anti-Double Scoring)
> [!important] Regla Crítica de Dominio
> Un participante solo puede enviar **una única respuesta** por cada pregunta de la partida.

- **Mecanismo de Control:** La entidad `GameSession` mantiene una estructura de conjunto en memoria:
  $$\text{Set}\langle\text{userId}\rangle \quad \text{por cada } \text{questionId}$$
- **Comportamiento ante reintentos:** Si un cliente envía múltiples paquetes `game:submit_answer` para la misma pregunta, el servidor descarta el reenvío y retorna un error `ALREADY_ANSWERED` o `409 Conflict`, preservando la primera respuesta registrada.

### Regla 2.2: Aislamiento Estricto de Salas (Room Isolation)
- Dos o más salas (ej. `SALA_A` y `SALA_B`) pueden ejecutarse concurrentemente en el mismo servidor.
- Los participantes conectados a `SALA_A` no deben recibir eventos emitidos por `SALA_B`.
- El puntaje, los participantes y el avance de preguntas de una sala son completamente independientes.

### Regla 2.3: Inmutabilidad del Cuestionario en Juego
- Mientras una sesión de juego se encuentre en estado `WAITING`, `QUESTION_ACTIVE` o `QUESTION_CLOSED`, el cuestionario subyacente y sus preguntas quedan **bloqueados para edición o eliminación**.
- Si el profesor intenta actualizar el cuestionario activo vía REST, el servidor rechaza la petición con código `422 Unprocessable Entity` ("Cannot modify quiz while an active session exists").

### Regla 2.4: Control Exclusivo del Anfitrión
- Solo el usuario que creó la sesión (`session.hostId === user.sub`) tiene autorización para:
  - Invocar `game:start_question`.
  - Invocar `game:close_question`.
  - Invocar `game:finish`.
- Cualquier intento de un participante por emitir comandos de anfitrión es interceptado por un Guard en el Gateway emitiendo `403 Forbidden`.

---

## 🔄 3. Reglas de Reconexión de Jugadores

| Situación | Acción del Servidor | Estado Resultante |
| :--- | :--- | :--- |
| **Pérdida de señal / Recarga** | El socket se desconecta; el registro del participante permanece intacto en la sesión. | `isConnected = false`. El puntaje y respuestas previas se preservan. |
| **Reingreso con mismo `userId` y PIN** | Se detecta el `userId` en la sesión, se asocia el nuevo `socketId`. | `isConnected = true`. No se crea una fila duplicada en la tabla. |
| **Sincronización (`state_sync`)** | Se envía de inmediato al socket recién conectado el estado actual de la ronda. | El jugador ve la pregunta activa, el tiempo restante y si ya respondió. |

---

## 🖼️ 4. Restricciones de Recursos Multimedia (Imágenes)

- **Propósito:** Cada pregunta puede incluir una imagen didáctica para contextualizar el problema de código o diagrama.
- **Tipos MIME autorizados:** `image/jpeg`, `image/png`, `image/webp`. Archivos ejecutables, SVGs con scripts o binarios son rechazados.
- **Tamaño límite:** $\le 5\text{ MB}$.
- **Persistencia:** Almacenadas en la ruta de volumen `/app/uploads` con nombres UUID para evitar colisiones (`uuidv4.extension`).

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[02 - Arquitectura y Diseno/Diseno Interno (Arquitectura en Capas - Layers)|Diseño Interno: Arquitectura en Capas (Layers)]]
- [[05 - Calidad y Pruebas/Estrategia de Pruebas Unitarias (Jest)|Pruebas Unitarias de Reglas con Jest]]
