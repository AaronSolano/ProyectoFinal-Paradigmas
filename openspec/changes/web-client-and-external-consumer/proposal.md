# Proposal: Web Client and External Consumer

## Why

El sistema requiere interfaces de usuario interactivas para que el docente pueda proyectar y moderar las evaluaciones y los alumnos puedan responder con comodidad desde sus dispositivos. Además, la rúbrica exige demostrar el desacoplamiento de la solución mediante una aplicación cliente externa independiente (`external-consumer`) en el puerto 5174 que consuma las APIs públicas usando el token JWT de audiencia.

## What Changes

- **Frontend Principal (`apps/web-client`)**: SPA moderna desarrollada con React 18, Vite y Tailwind CSS en el puerto `5173`.
  - **Módulo de Docente (Host)**: Login, gestor visual de cuestionarios, creación de sala en vivo, lobby con código PIN de 6 caracteres, pantalla de proyección con pregunta, imagen y temporizador, y visualización del podio final.
  - **Módulo de Estudiante (Player)**: Acceso con PIN y nombre, pantalla de espera sincronizada, interfaz de respuesta rápida con botones táctiles gigantes de Verdadero y Falso, y feedback visual tras el cierre de la ronda.
- **Cliente Externo de Demostración (`apps/external-consumer`)**: Aplicación web independiente en el puerto `5174` (HTML/JS/React) que realiza login contra `auth-service`, extrae el token con `aud: "profelink-game-api"` y consulta resultados históricos y partidas en `game-service` demostrando la viabilidad de integraciones de terceros.
- **Prueba Automatizada E2E del Consumidor Externo**: `test/external-consumer.e2e-spec.ts` validando el flujo completo de autenticación cruzada y consumo de API.
- **Dockerización**: Dockerfiles con Nginx para servir estáticamente ambas aplicaciones dentro de la red Docker Compose.

## Capabilities

### New Capabilities
- `host-and-player-ui`: Interfaces visuales para moderación de juegos y participación estudiantil conectadas a WebSockets y REST.
- `external-api-consumer`: Cliente web independiente en puerto 5174 para demostración de consumo de API por terceros.

### Modified Capabilities
<!-- None: Nuevos componentes de interfaz de usuario -->

## Impact

- **Código**: Crea `apps/web-client/` y `apps/external-consumer/`.
- **Red y Puertos**: Reserva los puertos externos `5173` y `5174` en Docker Compose.
