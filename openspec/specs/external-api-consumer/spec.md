# external-api-consumer Specification

## Purpose
Define el comportamiento del cliente web externo e independiente para demostrar la integración desacoplada mediante APIs públicas.

## Requirements

### Requirement: Independent Third-Party Consumption
The system SHALL provide an independent web application running on port 5174 that authenticates with `auth-service` and consumes endpoints from `game-service` via REST.

#### Scenario: External authentication and result retrieval
- **WHEN** the external consumer logs in using test credentials and queries session results on `game-service`
- **THEN** it successfully displays the session statistics and podium without direct database access.

#### Scenario: Rejection of calls without proper token
- **WHEN** the external consumer attempts to fetch game data without the Bearer token
- **THEN** the request fails with HTTP 401 Unauthorized.

#### Scenario: Hidden or missing session
- **WHEN** the consumer requests a room code and the API responds with HTTP 404 or HTTP 403
- **THEN** the consumer shows that message and does not render participant names or scores from the error body

#### Scenario: Sign out
- **WHEN** the person signs out
- **THEN** the consumer removes the access token from the browser session and does not keep the result list on screen

### Requirement: Historical session results via REST
The game-service SHALL expose an authenticated REST read of persisted finished sessions so a client can retrieve classification and podium data without direct database access. A finished session that the caller did not host and did not join SHALL be indistinguishable from a session that does not exist: the HTTP status and the response body MUST NOT reveal names, scores, podium, or that the room code is stored.

#### Scenario: List of finished sessions
- **WHEN** a caller sends `GET /api/sessions` with a valid Bearer token whose audience is `profelink-game-api`
- **THEN** the system returns HTTP 200 and the finished sessions in which that caller is host or participant, each with room code, completion time, participant display names, final scores, and rank

#### Scenario: Caller without finished sessions
- **WHEN** an authenticated caller has no persisted finished sessions as host or participant
- **THEN** the system returns HTTP 200 and an empty list

#### Scenario: Finished session detail
- **WHEN** a caller sends `GET /api/sessions/{roomCode}` with a valid Bearer token and that room code belongs to a persisted finished session visible to the caller
- **THEN** the system returns HTTP 200 with that session's participant scores and podium

#### Scenario: Session is not a persisted finished result
- **WHEN** a caller requests a room code that has no persisted finished session
- **THEN** the system returns HTTP 404

#### Scenario: Finished session hidden from an outsider
- **WHEN** an authenticated caller requests `GET /api/sessions/{roomCode}` for a persisted finished session in which they are neither host nor participant
- **THEN** the system returns HTTP 404 and the response body does not include participant names, scores, or podium

#### Scenario: Historical query without a token
- **WHEN** a caller requests `GET /api/sessions` or `GET /api/sessions/{roomCode}` without a Bearer token
- **THEN** the system returns HTTP 401
