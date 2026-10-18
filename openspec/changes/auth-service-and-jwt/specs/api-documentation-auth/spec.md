## Purpose

Expone la especificación OpenAPI de los servicios de autenticación mediante la interfaz interactiva Scalar para integración de clientes externos.

## ADDED Requirements

### Requirement: Scalar API Documentation Endpoint
The system SHALL expose an interactive OpenAPI documentation endpoint using Scalar UI on the route `/reference`.

#### Scenario: Navigating to auth documentation
- **WHEN** an integrator accesses `http://localhost:3001/reference` in a web browser
- **THEN** the system renders the interactive Scalar interface displaying endpoints `/api/auth/register`, `/api/auth/login`, and request/response DTO schemas.

#### Scenario: Fetching raw OpenAPI specification
- **WHEN** an HTTP client requests `http://localhost:3001/api-json` or `/reference/openapi.json`
- **THEN** the system returns a valid OpenAPI 3.0/3.1 JSON document.
