## Purpose

Define el comportamiento observable de la instrumentación telemétrica, captura de trazas distribuidas y paneles de monitoreo en Grafana.

## ADDED Requirements

### Requirement: OpenTelemetry Instrumentation and OTLP Export
The system SHALL instrument backend services to automatically generate and export traces and metrics to the OpenTelemetry Collector via OTLP.

#### Scenario: Exporting distributed trace
- **WHEN** an HTTP or WebSocket operation executes in `auth-service` or `game-service`
- **THEN** the OpenTelemetry SDK generates trace spans and exports them to `otel-collector:4318` without crashing the application on collector unavailability.

### Requirement: Grafana Operational Dashboard
The system SHALL provide an operational Grafana dashboard on port 3000 showing service health and request latency metrics.

#### Scenario: Accessing Grafana dashboard
- **WHEN** an evaluator opens `http://localhost:3000`
- **THEN** the dashboard renders live graphs showing request rates, response times, and active WebSocket connections.
