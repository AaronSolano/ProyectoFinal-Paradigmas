## Purpose

Centraliza las definiciones de tipos de TypeScript, enumeraciones de dominio y contratos compartidos entre los servicios de backend y clientes web del monorepo.

## ADDED Requirements

### Requirement: Shared Domain Enums
The system SHALL export canonical TypeScript enumerations for game session lifecycle states and user roles from `@profelink/shared-dtos`.

#### Scenario: Enum availability for services and frontends
- **WHEN** an application imports `@profelink/shared-dtos`
- **THEN** it receives `SessionStatus` (containing `WAITING`, `QUESTION_ACTIVE`, `QUESTION_CLOSED`, `FINISHED`) and `UserRole` (containing `HOST`, `PARTICIPANT`).

### Requirement: Shared Realtime Event Contract Definitions
The system SHALL define typed constants and payload interfaces for all WebSocket events used by the live Kahoot engine.

#### Scenario: Consuming typed WebSocket events
- **WHEN** client or server code subscribes to or emits Socket.io messages
- **THEN** event names such as `room:join`, `room:state_sync`, `room:participant_joined`, `game:start_question`, `game:question_opened`, `game:submit_answer`, `game:answer_ack`, `game:close_question`, `game:question_results`, and `game:finish` correspond to the shared contract.

### Requirement: Monorepo Workspaces Configuration
The system SHALL organize all codebase components under `pnpm workspaces` with centralized build scripts and shared TypeScript configuration.

#### Scenario: Monorepo dependency resolution
- **WHEN** `pnpm install` and `pnpm build` are executed from the repository root
- **THEN** dependencies across `apps/*` and `packages/*` are linked, with `@profelink/shared-dtos` available as an internal dependency.
