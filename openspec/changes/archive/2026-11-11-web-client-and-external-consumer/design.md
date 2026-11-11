## Context

Las aplicaciones web son el punto de contacto de profesores, estudiantes y auditores. `web-client` y `external-consumer` siguen separados. El backend de autenticación, cuestionarios, Socket.IO y resultados históricos ya existe. Véase `proposal.md` para el motivo. Esta revisión fija cómo VeriX consume esos contratos sin renombrar paquetes, esquemas ni endpoints.

## Goals / Non-Goals

**Goals:**
- Desarrollar `apps/web-client` con React 18, Vite y Tailwind CSS en el puerto `5173`, con la marca visible VeriX.
- Separar al profesor (`HOST`) y al estudiante (`PARTICIPANT`) después del login.
- Implementar el editor manual de cuestionarios Verdadero/Falso y la partida en vivo sobre los eventos Socket.IO existentes.
- Mostrar en VeriX los resultados históricos mediante `GET /api/sessions` y `GET /api/sessions/{roomCode}`.
- Desarrollar `apps/external-consumer` en el puerto `5174` como microaplicación independiente.
- Mantener la política CORS ya decidida y el paquete npm `@profelink/web-client`.

**Non-Goals:**
- No incluye generación de preguntas con IA.
- No incluye el banco persistente. Esa capacidad pertenece al cambio `reusable-challenge-bank`.
- No renombra paquetes internos, esquemas PostgreSQL, audiencia JWT ni rutas HTTP.
- No añade endpoints, migraciones ni cambios al motor de puntuación.
- No incluye edición de código en vivo, IDEs, pagos ni comercio electrónico.

## Decisions

### 1. Stack de Frontend: React + Vite + Tailwind CSS
- **Decisión**: Utilizar Vite con React 18 y Tailwind CSS 3 para el estilizado responsivo.
- **Racional**: Tiempos de arranque ultrarrápidos, recarga en caliente y la misma base para el teléfono del estudiante y el proyector. Tailwind 3 evita adoptar una configuración distinta mientras el paquete todavía no existe.
- **Alternativa descartada**: React 19 o una librería de componentes administrativa. Cambiaría la decisión ya registrada y empuja la interfaz hacia un panel genérico.

### 2. Gestión de conexiones en tiempo real
- **Decisión**: Encapsular Socket.IO en un cliente único de la funcionalidad en vivo. El estado de la partida es un reductor alimentado por eventos del servidor. El temporizador visible se calcula con `expiresAt` y no con una duración local.
- **Racional**: Los componentes quedan libres de la conexión y la pantalla no avanza hasta recibir `room:state_sync`, `game:question_opened`, `game:answer_ack`, `game:question_results` o `game:finish`.
- **Alternativa descartada**: un temporizador que descuenta los `timeLimitSeconds` desde el clic local. Se desfasa del cierre real del servidor.

### 3. Independencia de `external-consumer`
- **Decisión**: Estructurar `apps/external-consumer` como un proyecto desacoplado, con su propio `package.json` y `Dockerfile`, en el puerto `5174`.
- **Racional**: Demuestra que un cliente sin el código del juego consulta resultados solo por la API pública.

### 4. CORS HTTP en ambos servicios NestJS
- **Decisión**: `auth-service` y `game-service` aplican la misma política CORS. Los orígenes permitidos son exactamente `http://localhost:5173` y `http://localhost:5174`. La respuesta refleja el origen solicitante permitido en `Access-Control-Allow-Origin`. Los métodos permitidos incluyen `GET`, `POST`, `PATCH`, `DELETE` y `OPTIONS`. Los encabezados permitidos incluyen `Authorization` y `Content-Type`. Una petición `OPTIONS` de preflight desde uno de esos orígenes responde con éxito. Cualquier otro origen no recibe concesión de acceso.
- **Racional**: El cliente de Vite y el consumidor externo viven en otro puerto que las APIs. Esta decisión ya está implementada y no se reabre.

### 5. Consulta REST de resultados históricos
- **Decisión**: `game-service` publica `GET /api/sessions` y `GET /api/sessions/{roomCode}`. Ambas exigen Bearer JWT con audiencia `profelink-game-api`. El listado devuelve solo sesiones finalizadas y persistidas en las que el caller es anfitrión (`hostId`) o participante (`session_participants.userId`), con código de sala, momento de cierre, nombres, puntaje final y puesto. El detalle devuelve el podio de esa sala solo bajo la misma condición. Una sala desconocida, todavía no persistida o no finalizada responde 404. Una sesión finalizada ajena al caller responde con el mismo HTTP 404 y sin nombres, puntajes ni podio. La ausencia de token, o un token con audiencia distinta, responde 401.
- **Racional**: VeriX y el consumidor externo leen el mismo contrato. No se crea una ruta paralela para la marca nueva.

### 6. Marca visible VeriX y nombres internos intactos
- **Decisión**: toda pantalla, título del documento y texto comercial dicen VeriX. El paquete sigue siendo `@profelink/web-client`. La audiencia sigue siendo `profelink-game-api`. Las rutas siguen siendo `/api/auth/*`, `/api/quizzes/*`, `/api/upload` y `/api/sessions`.
- **Racional**: el nombre comercial cambia la experiencia, no los contratos que la prueba integral ya verificó.
- **Alternativa descartada**: renombrar paquetes y audiencia. Rompería el token, CORS no lo exige y el usuario lo prohibió.

### 7. Organización por funcionalidades
- **Decisión**: el código de `apps/web-client/src` se agrupa en `app`, `features/auth`, `features/quizzes`, `features/live`, `features/results` y `shared`. Cada funcionalidad guarda sus páginas, su cliente HTTP o Socket.IO y su estado. El banco futuro ocupará `features/question-bank` y no se crea en el flujo principal.
- **Racional**: las pantallas del profesor y del estudiante comparten sesión y socket sin mezclar el editor con la partida.
- **Alternativa descartada**: carpetas `components/pages/services` sin límite. El estado del juego terminaría repartido entre vistas.

### 8. Rutas y control de rol
- **Decisión**: React Router separa `/ingresar`, `/registro`, el área `/profesor` y el área `/estudiante`. El registro envía el rol elegido al contrato actual. Después del login, la ruta permitida sale del claim `role` del token. Un `PARTICIPANT` no ve el editor. Un `HOST` no usa la pantalla de respuesta.
- **Racional**: el backend acepta el rol en el registro y no ofrece un endpoint de perfil. La puerta se aplica en el cliente y cada mutación sigue protegida por el JWT del servidor.
- **Alternativa descartada**: una sola pantalla que esconde botones según el rol. Facilita que un estudiante abra el editor por URL.

### 9. Sesión del navegador
- **Decisión**: el access token se guarda en `sessionStorage` y se envía como `Authorization: Bearer`. No se escribe en el registro de la consola ni en la URL. Al cerrar la pestaña, la sesión desaparece. Las URLs salen de `import.meta.env.VITE_AUTH_API_URL`, `VITE_GAME_API_URL` y `VITE_GAME_WS_URL`.
- **Racional**: esas tres variables ya están en `.env.example` y apuntan a `http://localhost:3001` y `http://localhost:3002`. No hace falta otra variable para la marca.
- **Alternativa descartada**: `localStorage` permanente y un cliente HTTP nuevo. Amplía la exposición del token sin un requisito que lo pida.

### 10. Código de sala y QR
- **Decisión**: la sala muestra el `roomCode` devuelto por `POST /api/quizzes/{quizId}/sessions`, con formato `PL-` y cuatro caracteres. El QR se genera en el navegador con `qrcode.react` y apunta a `/estudiante/sala/{roomCode}`. No existe ni se crea un endpoint de QR. El estudiante autenticado confirma su nombre visible y emite `room:join`. La espera solo aparece después de `room:state_sync`. No puede iniciar ni cerrar preguntas. Si no hay sesión, el enlace se conserva y el ingreso vuelve a esa sala. El botón «Iniciar juego» permanece desactivado y no emite `game:start_question`. El anfitrión entra con `room:join` y el token en `auth.token`. El contador de jugadores excluye el rol `HOST`. Un nombre visible que contiene ProfeLink se sustituye al mostrarlo y al enviarlo en `displayName`.
- **Racional**: el generador real del backend produce `PL-` más cuatro caracteres del alfabeto sin `I`, `O`, `0` ni `1`. El texto anterior de un PIN de seis caracteres no coincide con ese contrato.

### 11. El banco persistente vive en otro cambio
- **Decisión**: este cambio crea las preguntas manuales con `POST /api/quizzes/{quizId}/questions`. El banco en PostgreSQL, sus filtros y la copia transaccional pertenecen a `reusable-challenge-bank`. Ninguno de los dos cambios genera preguntas con IA.
- **Racional**: meter el banco aquí contradiría el alcance del cliente y duplicaría la decisión de no tener, hasta ahora, una tabla reutilizable.

### 12. Dependencias mínimas y pruebas
- **Decisión**: además de React 18, Vite, TypeScript y Tailwind CSS 3, el cliente agrega `react-router-dom`, `socket.io-client` y `qrcode.react`. Las pruebas de VeriX usan Vitest y Testing Library sobre el reductor de la partida, las puertas de rol y los botones Verdadero/Falso. El consumidor externo conserva la prueba Jest ya prevista.
- **Racional**: `fetch` cubre REST. No se agregan Redux, Axios ni una librería de movimiento; las animaciones quedan en CSS.
- **Alternativa descartada**: Playwright dentro de este cambio. La prueba de extremo a extremo del consumidor ya tiene su tarea y la observabilidad vive en otro cambio.

### 13. Tiempo individual de cada pregunta
- **Decisión**: el editor acepta un entero de 5 a 120 segundos por pregunta y muestra «El tiempo debe ser un entero entre 5 y 120 segundos.» si el valor queda fuera. El mismo rango lo exigen los DTO de creación y edición. No cambia la columna de Prisma ni los tiempos sugeridos del banco.
- **Racional**: cada pregunta ya tenía `timeLimitSeconds`. El motor usa ese valor al abrir la sala. Solo faltaba el máximo.

### 14. Pregunta en vivo sin cierre de partida
- **Decisión**: el profesor emite `game:start_question` y `game:close_question`. El temporizador visible sale de `expiresAt`. La pregunta abierta no muestra `correctAnswer`. El estudiante envía una sola vez `game:submit_answer` y, al llegar `game:question_results`, ve si su respuesta coincide, su puntaje y la clasificación. Ninguna pantalla emite `game:finish` ni muestra el podio.
- **Racional**: el contrato de la ronda ya existe. El podio visual queda para la revisión siguiente.

### 15. Cierre seguro de la partida
- **Decisión**: «Finalizar partida» aparece solo cuando el servidor indica que no hay más preguntas. El profesor confirma y se emite `game:finish` una vez. El servidor rechaza un cierre prematuro, un segundo cierre y a quien no es anfitrión. Persiste antes de emitir. Si el guardado falla, no emite `game:finish` y la sala sigue abierta. La clasificación final es `finalLeaderboard`; el anfitrión no entra. El estudiante muestra posición y puntaje de ese arreglo, sin calcularlos en el navegador.
- **Racional**: el evento y el payload ya existen. El historial queda fuera de esta etapa.

### 16. Podio visual
- **Decisión**: profesor y estudiante comparten la misma pantalla al recibir `game:finish`. El podio usa `podium` y deja vacíos los puestos que no llegaron. La lista usa `finalLeaderboard` en el orden del servidor, con el puntaje y el puesto tal como vienen. El anfitrión no se agrega en el navegador. El resultado permanece en la pantalla si el socket se corta. El profesor vuelve a su panel y el estudiante a su inicio, sin emitir `game:finish` otra vez.
- **Racional**: el payload ya trae podio y clasificación. La presentación es CSS, sin una librería 3D y sin cambiar el motor.

### 17. Historial y recuperación
- **Decisión**: el profesor y el estudiante consultan `GET /api/sessions` y `GET /api/sessions/{roomCode}`. La pantalla muestra código, fecha, participantes, puesto y puntaje que devuelve el servidor, y el detalle reutiliza el podio. El título del cuestionario no está en ese contrato y no se inventa. Si la persona ya estaba en la sala, no recibió `game:finish` y la sala en vivo desaparece, el cliente pide el detalle autenticado. Un 401, 403 o 404 no fabrica una clasificación. El permiso lo decide el servidor.
- **Racional**: la persistencia y el filtro por anfitrión o participante ya existen. `room:state_sync` no puede reconstruir el resultado después de borrar la sala.

### 18. Consumidor externo
- **Decisión**: `apps/external-consumer` corre en `http://localhost:5174` y solo usa `POST /api/auth/login`, `GET /api/sessions` y `GET /api/sessions/{roomCode}`. El token vive en `sessionStorage` de ese origen. CORS ya admite ese origen en auth-service y game-service, así que no se cambia el backend. El paquete no importa código de los servicios ni de Prisma. Las pruebas son Vitest con respuestas simuladas.
- **Racional**: la rúbrica pide un proyecto que consuma la API por red. Un E2E contra PostgreSQL queda fuera de esta etapa.

## Risks / Trade-offs

- **[Riesgo: el temporizador del cliente se adelanta o atrasa]** → **Mitigación**: calcular `remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))` y esperar `game:question_results` para cerrar la ronda.
- **[Riesgo: el navegador bloquea las llamadas entre puertos]** → **Mitigación**: la decisión 4 ya está aplicada. Verificarla de nuevo solo si cambia el origen.
- **[Riesgo: `game:finish` llega antes de que la fila exista]** → **Mitigación**: la pantalla histórica vuelve a consultar `GET /api/sessions/{roomCode}` si el primer detalle todavía no está persistido y muestra el 404 real cuando la sala no es visible.
- **[Riesgo: el registro permite elegir `HOST`]** → **Mitigación**: se documenta el comportamiento actual. La interfaz separa las áreas, pero no se presenta como un control de autorización del servidor.
- **[Riesgo: el token queda en `sessionStorage`]** → **Mitigación**: no se imprime ni se pone en la URL. Al cerrar la pestaña se elimina.

## Migration Plan

No hay migración de datos. El campo `timeLimitSeconds` conserva su nombre; el rango aceptado pasa a ser de 5 a 120 segundos. El primer incremento crea el paquete `@profelink/web-client` donde hoy solo existe `apps/web-client/.gitkeep`. Si el andamiaje falla, se retira ese paquete sin tocar `auth-service` ni `game-service`.

## Open Questions

Ninguna. El banco persistente queda en `reusable-challenge-bank`.
