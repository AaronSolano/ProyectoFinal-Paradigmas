## Purpose

Define el comportamiento del cliente web externo e independiente para demostrar la integración desacoplada mediante APIs públicas.

## ADDED Requirements

### Requirement: Independent Third-Party Consumption
The system SHALL provide an independent web application running on port 5174 that authenticates with `auth-service` and consumes endpoints from `game-service` via REST.

#### Scenario: External authentication and result retrieval
- **WHEN** the external consumer logs in using test credentials and queries session results on `game-service`
- **THEN** it successfully displays the session statistics and podium without direct database access.

#### Scenario: Rejection of calls without proper token
- **WHEN** the external consumer attempts to fetch game data without the Bearer token
- **THEN** the request fails with HTTP 401 Unauthorized.
