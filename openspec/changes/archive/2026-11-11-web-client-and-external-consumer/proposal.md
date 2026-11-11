# Proposal: Web Client and External Consumer

## Why

El sistema requiere interfaces de usuario interactivas para que el docente pueda proyectar y moderar las evaluaciones y los alumnos puedan responder con comodidad desde sus dispositivos. Además, la rúbrica exige demostrar el desacoplamiento de la solución mediante una aplicación cliente externa independiente (`external-consumer`) en el puerto 5174 que consuma las APIs públicas usando el token JWT de audiencia.

## What Changes

- **Nombre comercial**: la aplicación de juego se presenta como **VeriX**. ProfeLink permanece solo como nombre interno del monorepo, de los paquetes, de la audiencia JWT y de las rutas HTTP ya publicadas. No se renombran paquetes, esquemas ni endpoints.
- **Frontend principal (`apps/web-client`)**: SPA con React 18, Vite y Tailwind CSS en el puerto `5173`, con identidad oscura, neón cian y magenta.
  - Autenticación y separación por rol `HOST` o `PARTICIPANT`.
  - Panel del profesor, alta y edición manual de cuestionarios y preguntas Verdadero/Falso.
  - Sala de espera con el código real de sala y un QR generado en el cliente.
  - Partida sincronizada por Socket.IO, temporizador, respuesta, retroalimentación, clasificación y podio.
  - Consulta, dentro de VeriX, de los resultados históricos ya expuestos por REST.
- **Banco de preguntas**: queda fuera de este cambio. Su persistencia, consulta y copia se planifican en `reusable-challenge-bank`. Este cambio no genera preguntas con IA.
- **Cliente externo de demostración (`apps/external-consumer`)**: aplicación web independiente en el puerto `5174` que realiza login contra `auth-service`, extrae el token con `aud: "profelink-game-api"` y consulta resultados históricos en `game-service`.
- **Lectura REST de resultados históricos**: `game-service` expone una consulta autenticada de sesiones ya finalizadas y persistidas, con clasificación y podio. VeriX y el consumidor externo usan ese mismo contrato; no se duplica el endpoint.
- **Acceso HTTP desde el navegador**: `auth-service` y `game-service` aceptan llamadas cross-origin desde `http://localhost:5173` y `http://localhost:5174`, incluidas las peticiones preflight `OPTIONS` que provocan `Authorization` y `Content-Type`.
- **Prueba automatizada E2E del consumidor externo**: `test/external-consumer.e2e-spec.ts` validando el flujo completo de autenticación cruzada y consumo de API.
- **Dockerización**: Dockerfiles con Nginx para servir estáticamente ambas aplicaciones dentro de la red Docker Compose.

## Capabilities

### New Capabilities
- `host-and-player-ui`: Interfaz VeriX para autenticación por rol, edición manual de cuestionarios, sala en vivo y consulta de resultados históricos ya persistidos.
- `external-api-consumer`: Cliente web independiente en puerto 5174 para demostración de consumo de API por terceros, incluida la lectura REST de resultados históricos.
- `cross-origin-http-access`: Comunicación HTTP del navegador desde `http://localhost:5173` y `http://localhost:5174` hacia `auth-service` y `game-service`, con preflight permitido.

### Modified Capabilities
<!-- None: las capacidades de este cambio todavía no están archivadas en openspec/specs. -->

## Impact

- **Código**: crea `apps/web-client/` y `apps/external-consumer/`. La lectura REST y CORS de las tareas 6.1 y 6.2 ya están implementadas; esta etapa no modifica backend ni base de datos.
- **Identidad**: la UI visible dice VeriX. Los nombres internos `@profelink/*`, `profelink-game-api` y las rutas `/api/*` no cambian.
- **Red y puertos**: reserva los puertos externos `5173` y `5174`. Los orígenes permitidos siguen siendo exactamente `http://localhost:5173` y `http://localhost:5174`.
- **Configuración**: el cliente lee `VITE_AUTH_API_URL`, `VITE_GAME_API_URL` y `VITE_GAME_WS_URL`, ya previstas en `.env.example`.
