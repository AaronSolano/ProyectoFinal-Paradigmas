## Purpose

Define el protocolo de reconexión transparente para jugadores que experimenten desconexiones de red o recarga de navegador sin duplicidad de presencia.

## ADDED Requirements

### Requirement: Seamless Participant Reconnection
The system SHALL detect reconnecting participants using their authenticated `userId`, update their socket binding, and synchronize their view without creating duplicate records.

#### Scenario: Participant browser refresh during active question
- **WHEN** a participant loses connection and reconnects with the same `userId` and room code
- **THEN** the system updates the participant's active `socketId`, preserves their accumulated score and answer status, and emits `room:state_sync` with the current round state.

#### Scenario: Preserving participant count
- **WHEN** an existing participant reconnects
- **THEN** the lobby participant count and list remain unchanged without duplicating the participant name.
