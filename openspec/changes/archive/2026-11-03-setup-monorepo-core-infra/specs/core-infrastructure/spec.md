## Purpose

Define y garantiza el aprovisionamiento reproducible de la infraestructura de contenedores, persistencia en volúmenes Docker y ejecución unificada del ecosistema distribuido ProfeLink.

## ADDED Requirements

### Requirement: Multi-Schema Relational Persistence
The system SHALL provide a PostgreSQL 16 container managing two logically isolated schemas (`auth` and `game`) on a single database instance (`profelink_db`) with volume persistence.

#### Scenario: Database container initialization
- **WHEN** the operator starts services via Docker Compose
- **THEN** PostgreSQL starts healthy with default database `profelink_db`, exposed on port 5432, with schemas `auth` and `game` available for service connections.

#### Scenario: Relational data persistence across container restarts
- **WHEN** `docker compose restart` or container recreation occurs with volume `pgdata` attached
- **THEN** all data, schemas, and tables in PostgreSQL remain intact without data loss.

### Requirement: Media Storage Volume Persistence
The system SHALL provide a dedicated Docker named volume `quiz_images` mounted at `/app/uploads` for persistent quiz media storage.

#### Scenario: File persistence in media volume
- **WHEN** a service writes media files into `/app/uploads` and the container is restarted
- **THEN** all uploaded files in `/app/uploads` remain accessible and uncorrupted.

### Requirement: Single-Command System Startup
The system SHALL provide automated startup scripts (`start.sh` and `start.ps1`) that orchestrate the development environment in a single execution.

#### Scenario: Running startup script
- **WHEN** the developer executes `./start.sh` or `./start.ps1`
- **THEN** the script verifies Docker availability, creates `.env` from `.env.example` if absent, starts infrastructure containers via Docker Compose, and verifies database readiness before concluding.

### Requirement: Standardized Environment Configuration
The system SHALL provide a `.env.example` file specifying all required variables, database URLs for each schema, and the mandatory JWT audience.

#### Scenario: Validating environment configuration
- **WHEN** an operator inspects `.env.example`
- **THEN** it defines `PORT=3001` (auth), `PORT=3002` (game), `POSTGRES_DB=profelink_db`, `JWT_SECRET`, and `JWT_AUDIENCE=profelink-game-api`.
