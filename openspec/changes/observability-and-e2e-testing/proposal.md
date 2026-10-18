# Proposal: Observability and E2E Testing

## Why

Para alcanzar el 100% de la rúbrica de evaluación (40 puntos / 30%) del curso EIF400, el sistema debe demostrar observabilidad operativa distribuida (métricas de latencia y trazas de ejecución con OpenTelemetry y Grafana) y garantizar su calidad mediante pruebas end-to-end con Playwright simulando múltiples usuarios en tiempo real.

## What Changes

- **Telemetría Distribuida (OpenTelemetry)**: Instrumentación de `apps/auth-service` y `apps/game-service` usando el SDK de OpenTelemetry (`@opentelemetry/sdk-node`), exportando trazas HTTP y WebSocket vía OTLP.
- **Infraestructura de Monitoreo en Docker Compose**:
  - Contenedor `otel-collector` (`otel/opentelemetry-collector-contrib`) en puertos `4317` y `4318`.
  - Contenedor `grafana` en el puerto `3000` con dashboards preconfigurados para monitorear ráfagas de respuestas, tiempos de respuesta y salud de contenedores.
- **Pruebas End-to-End con Playwright**: Suite automatizada `e2e/game-flow.spec.ts` que lanza 3 contextos de navegador simultáneos (1 Docente proyector + 2 Estudiantes respondiendo en paralelo) verificando la dinámica completa de Kahoot V/F.
- **Auditoría Final para la Defensa**: Script de validación automatizada de los 40 puntos del checklist antes de la entrega final.

## Capabilities

### New Capabilities
- `distributed-observability`: Captura y visualización de trazas distribuidas y métricas con OpenTelemetry y Grafana.
- `e2e-multiplayer-testing`: Pruebas de integración total simulando flujos concurrentes multi-usuario con navegadores reales mediante Playwright.

### Modified Capabilities
<!-- None: Nueva funcionalidad de calidad y observabilidad -->

## Impact

- **Infraestructura**: Agrega `otel-collector` y `grafana` a `docker-compose.yml` exponiendo el puerto `3000`.
- **Dependencias**: Agrega `@playwright/test` al root del monorepo y paquetes `@opentelemetry/*` a los backends.
