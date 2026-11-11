## Purpose

Permite clasificar un cuestionario, mantenerlo privado y publicarlo de forma voluntaria para que otro profesor lo consulte y lo copie sin modificar el original.

## ADDED Requirements

### Requirement: Categorized private quizzes
The VeriX form for a new quiz SHALL require exactly one of these categories before submission: `cultura-general`, `ciencias`, `tecnologia`, `historia`, `geografia`, or `deportes`. A new quiz SHALL be private. The stored category SHALL remain optional. Existing quizzes without a category SHALL remain valid and private until their owner changes them.

#### Scenario: Create form requires a category
- **WHEN** a host attempts to submit the new-quiz form without a category
- **THEN** the form blocks the submission and does not create a quiz

#### Scenario: Create a categorized quiz
- **WHEN** a host creates a quiz with a valid category
- **THEN** the system stores that category and keeps the quiz unpublished

#### Scenario: Existing quiz without a category
- **WHEN** the library columns are added
- **THEN** quizzes created earlier remain stored, private, and without a category

### Requirement: Only the owner can edit or publish
The system SHALL allow only the quiz owner to change its title, description, category, questions, or published state. Publishing SHALL also require the `HOST` role. A non-owner SHALL receive HTTP 403 and the quiz SHALL remain unchanged.

#### Scenario: Owner publishes
- **WHEN** the owner, with role `HOST`, explicitly publishes the quiz
- **THEN** the quiz becomes visible in the library and records its publication time

#### Scenario: Another user tries to publish
- **WHEN** an authenticated user who does not own the quiz tries to publish or edit it
- **THEN** the system returns HTTP 403 and does not change the quiz

### Requirement: Publication requires at least one question
The system SHALL refuse to publish a quiz that contains no questions. The quiz SHALL remain private.

#### Scenario: Empty quiz publication
- **WHEN** the owner, with role `HOST`, tries to publish a quiz with zero questions
- **THEN** the system returns HTTP 400 and leaves the quiz unpublished

### Requirement: Teacher CRUD requires the host role
Quiz and question create, read, update, and delete operations SHALL be available only to an authenticated user with role `HOST`. An authenticated `PARTICIPANT` SHALL receive HTTP 403, and the system SHALL NOT create, change, or delete a quiz or question. Live session join, scoring, and Socket.IO behavior SHALL stay unchanged.

#### Scenario: Participant uses quiz CRUD
- **WHEN** an authenticated `PARTICIPANT` creates, reads, updates, or deletes a quiz or one of its questions
- **THEN** the system returns HTTP 403 and writes nothing

### Requirement: Browse the published library
An authenticated `HOST` SHALL list published quizzes and filter them by category. The list SHALL be paginated with at most 20 items. The host SHALL be able to read the questions of a published quiz, including each correct answer. A private quiz SHALL be indistinguishable from a missing quiz on the library routes.

#### Scenario: Filter published quizzes
- **WHEN** a host requests the library with one of the six categories
- **THEN** the system returns HTTP 200 with only published quizzes of that category, the page, the page size, and the total

#### Scenario: Private quiz lookup
- **WHEN** a host requests a library detail for a quiz that is private or absent
- **THEN** the system returns HTTP 404 and no questions or scores

#### Scenario: Participant browses the library
- **WHEN** an authenticated `PARTICIPANT` requests the library
- **THEN** the system returns HTTP 403

#### Scenario: Library request without a token
- **WHEN** a library route is requested without a Bearer token
- **THEN** the system returns HTTP 401

### Requirement: Independent copy of a published quiz
A host SHALL be able to copy a published quiz into a new quiz that the host owns. The copy SHALL contain new question rows with the same statements, answers, images, time limits, and order. The copy SHALL be private. Changing or deleting the copy SHALL NOT change the original. Deleting the original SHALL NOT delete existing copies.

#### Scenario: Another teacher reuses a quiz
- **WHEN** a host copies a published quiz owned by someone else
- **THEN** the system creates a new private quiz and new questions owned by the caller

#### Scenario: Edit the copy
- **WHEN** the owner of a copy changes or deletes one of its questions
- **THEN** the original quiz and its questions remain unchanged

#### Scenario: Delete the original
- **WHEN** the owner deletes a published quiz that already has copies
- **THEN** the copies remain available to their owners
