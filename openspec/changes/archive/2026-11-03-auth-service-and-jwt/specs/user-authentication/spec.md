## Purpose

Define las reglas de negocio y comportamiento observable para el registro de usuarios, autenticación segura y emisión de tokens JWT con validación de audiencia.

## ADDED Requirements

### Requirement: User Registration and Password Hashing
The system SHALL provide an endpoint `/api/auth/register` that stores new users in the `auth` schema with encrypted password hashes.

#### Scenario: Successful user registration
- **WHEN** a client sends a valid registration payload with email, password, displayName, and role
- **THEN** the system creates the user record, stores the password as a bcrypt hash, and returns HTTP 201 with the created user profile (excluding the password hash).

#### Scenario: Duplicate email registration
- **WHEN** a client attempts to register an email that already exists
- **THEN** the system returns HTTP 409 Conflict with an explanatory error message.

### Requirement: Credential Authentication and JWT Audience Issuance
The system SHALL provide an endpoint `/api/auth/login` that verifies credentials and issues a signed JWT token containing strict audience claims.

#### Scenario: Successful login with valid audience claim
- **WHEN** a client sends valid email and password credentials to `/api/auth/login`
- **THEN** the system returns HTTP 200 with an `accessToken` whose decoded claims include `aud: "profelink-game-api"`, `iss: "profelink-auth-service"`, `sub: userId`, and `role`.

#### Scenario: Failed login with invalid password
- **WHEN** a client submits incorrect credentials
- **THEN** the system rejects the request with HTTP 401 Unauthorized without disclosing which field was incorrect.

### Requirement: Default System Seeding
The system SHALL provide automated seeding of default test credentials for development and academic grading.

#### Scenario: Running auth database seed
- **WHEN** the database seeding script executes
- **THEN** user `profe@profelink.cr` (role HOST) and `alumno@profelink.cr` (role PARTICIPANT) are created if they do not already exist.
