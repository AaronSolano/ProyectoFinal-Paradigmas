## Context

La entrega final del curso EIF400 requiere demostrar que la solución no solo funciona en el "camino feliz", sino que es observable operativamente y resiste pruebas automatizadas de concurrencia multi-usuario. Véase `proposal.md` para motivación.

## Goals / Non-Goals

**Goals:**
- Instrumentar `auth-service` y `game-service` con `@opentelemetry/sdk-node`.
- Orquestar `otel-collector` y `grafana` en `docker-compose.yml` (puerto `3000`).
- Configurar un dashboard declarativo en Grafana para monitorear latencia y WebSockets.
- Implementar suite multi-navegador con Playwright simulando 1 Host y 2 Estudiantes.
- Proveer script de verificación previa a la defensa (`test-all.ps1` / `test-all.sh`).

**Non-Goals:**
- No incluye alertas pagadas en la nube ni integraciones con Datadog/AWS CloudWatch.
- No incluye pruebas de carga con miles de usuarios (JMeter/k6).

## Decisions

### 1. OpenTelemetry Node SDK con Exportador OTLP
- **Decisión**: Cargar el SDK de OpenTelemetry mediante precarga (`node --require ./dist/telemetry.js`) o interceptor de NestJS exportando a `http://otel-collector:4318`.
- **Racional**: Estándar de la industria para observabilidad neutral ante proveedores.

### 2. Aprovisionamiento Declarativo de Grafana
- **Decisión**: Montar configuraciones y dashboards JSON en `/etc/grafana/provisioning` dentro del contenedor de Grafana.
- **Racional**: Garantiza que al ejecutar `./start.sh` el panel de control esté inmediatamente disponible sin configuración manual.

### 3. Aislamiento de Contextos en Playwright
- **Decisión**: Usar `browser.newContext()` para cada participante en la prueba E2E.
- **Racional**: Asegura que el host y los dos alumnos operen con cookies, almacenamiento local y conexiones WebSocket 100% aisladas en una sola corrida de prueba.

## Risks / Trade-offs

- **[Riesgo: Sobrecarga de CPU/RAM al levantar Grafana y OTel en máquinas modestas]** → **Mitigación**: Establecer límites de memoria en `docker-compose.yml` para el recolector y Grafana.
- **[Riesgo: Inestabilidad (flakiness) en pruebas E2E por temporizadores]** → **Mitigación**: Uso de esperas basadas en eventos (`waitForSelector`, `expect.poll`) en lugar de `sleep` fijos.
