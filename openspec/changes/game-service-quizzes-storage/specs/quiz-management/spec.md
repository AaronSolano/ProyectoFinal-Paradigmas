## Purpose

Define el comportamiento observable para la creación, lectura, actualización y eliminación de cuestionarios y preguntas Verdadero o Falso con reglas de autoría.

## ADDED Requirements

### Requirement: Quiz Author Ownership and CRUD
The system SHALL allow authenticated hosts to create, read, update, and delete quizzes while preventing non-owners from modifying them.

#### Scenario: Creating a new quiz
- **WHEN** an authenticated host submits a valid title and description to `POST /api/quizzes`
- **THEN** the system creates the quiz associating `ownerId` with the token's `sub` claim and returns HTTP 201 with the created quiz object.

#### Scenario: Unauthorized quiz modification by non-owner
- **WHEN** an authenticated user attempts to update or delete a quiz created by another user
- **THEN** the system rejects the request with HTTP 403 Forbidden.

### Requirement: True/False Question Management
The system SHALL allow quiz owners to manage binary (True/False) questions including statement text, optional image URL, correct answer, and time limit.

#### Scenario: Adding a True/False question
- **WHEN** the quiz owner posts a question with `statement`, `correctAnswer: boolean`, and `timeLimitSeconds`
- **THEN** the system stores the question associated with the quiz and returns HTTP 201.
