## Purpose

Establece el mecanismo de verificación criptográfica de tokens JWT y cumplimiento estricto del claim de audiencia en la capa de seguridad.

## ADDED Requirements

### Requirement: Strict JWT Audience Verification
The system SHALL intercept incoming requests to protected routes and reject any token whose `aud` claim does not equal `"profelink-game-api"`.

#### Scenario: Valid request with correct audience claim
- **WHEN** a client calls a protected endpoint with `Authorization: Bearer <token>` where `aud === "profelink-game-api"` and signature is valid
- **THEN** the system authorizes the request and attaches user context (`sub`, `email`, `role`) to the execution pipeline.

#### Scenario: Rejection of token with mismatched audience
- **WHEN** a client presents a validly signed token with a different audience claim or missing `aud`
- **THEN** the system rejects the request immediately with HTTP 401 Unauthorized.
