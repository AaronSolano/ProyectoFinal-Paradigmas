## Purpose

Define el comportamiento observable del gateway de WebSockets, el ciclo de vida de las salas y el aislamiento estricto de eventos entre salas concurrentes.

## ADDED Requirements

### Requirement: Socket Authentication and Room Lifecycle
The system SHALL authenticate incoming WebSocket connections via JWT handshake and manage room transitions from `WAITING` through `FINISHED`.

#### Scenario: Connecting with valid JWT
- **WHEN** a client initiates a WebSocket connection with a valid JWT token bearing `aud: "profelink-game-api"`
- **THEN** the gateway accepts the connection and associates user identity to the socket instance.

#### Scenario: Room creation and host control
- **WHEN** an authenticated host starts a game session
- **THEN** the system generates a unique 6-character room code in `WAITING` status and allows only the host to trigger state transitions.

### Requirement: Strict Room Isolation
The system SHALL ensure that events and messages emitted in one room never leak to or affect participants in any other active room.

#### Scenario: Concurrent rooms isolation
- **WHEN** `SALA_A` and `SALA_B` run concurrently on the same server and host in `SALA_A` opens a question
- **THEN** participants in `SALA_A` receive `game:question_opened` while participants in `SALA_B` receive no events from `SALA_A`.
