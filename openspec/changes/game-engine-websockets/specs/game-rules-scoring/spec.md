## Purpose

Especifica las reglas matemáticas y de integridad para la aceptación de respuestas binarias, control de tiempo de servidor y anti-doble votación.

## ADDED Requirements

### Requirement: Anti-Double Voting Enforcement
The system SHALL accept at most one answer per participant for each active question in a session.

#### Scenario: First answer submission
- **WHEN** a participant submits a boolean answer for the active question before expiration
- **THEN** the system registers the answer and returns a successful acknowledgement (`game:answer_ack`).

#### Scenario: Duplicate answer attempt rejected
- **WHEN** the same participant attempts to submit another answer for the same question
- **THEN** the system rejects the duplicate submission with an error code and maintains the original answer.

### Requirement: Server-Side Time Limit and Correct Answer Concealment
The system SHALL validate answer arrival times against server timestamps and keep `correctAnswer` concealed until question closure.

#### Scenario: Concealed answer on question open
- **WHEN** the host triggers `game:start_question`
- **THEN** the system broadcasts `game:question_opened` omitting the `correctAnswer` field.

#### Scenario: Late answer rejection
- **WHEN** an answer arrives after `expiresAt`
- **THEN** the system marks the submission as expired, awarding 0 points regardless of answer value.

#### Scenario: Results reveal on question close
- **WHEN** the question is closed by timer or host action
- **THEN** the system broadcasts `game:question_results` containing the actual `correctAnswer`, aggregate statistics, and updated leaderboard.
