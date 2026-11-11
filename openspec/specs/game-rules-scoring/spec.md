# game-rules-scoring Specification

## Purpose
Especifica las reglas matemáticas y de integridad para la aceptación de respuestas binarias, control de tiempo de servidor y anti-doble votación.

## Requirements

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

### Requirement: One opening per question index
The system SHALL award points for a question index only on its first opening. Reopening an index that is active or already closed SHALL NOT reset that question's answers and SHALL NOT add points.

#### Scenario: Reopening an active or closed question
- **WHEN** the host sends `game:start_question` again for a `questionIndex` that was already opened
- **THEN** the system rejects the opening and each participant keeps the points already awarded for that question

#### Scenario: Sequential next question
- **WHEN** the host opens a question index that has not been opened yet
- **THEN** the room keeps a single timer and a correct answer on that new question awards one point

### Requirement: Host excluded from competition
The host SHALL remain in the participant list with role `HOST` and SHALL NOT appear in `leaderboard` or `podium`.

#### Scenario: Ranking after a question closes
- **WHEN** the room broadcasts `game:question_results` or `game:finish`
- **THEN** the host is absent from the leaderboard and the podium, and remains present in the participant list

#### Scenario: No artificial room capacity
- **WHEN** a room is created
- **THEN** the system does not impose a participant cap and does not claim support for 200 students without a later load test

### Requirement: Safe match finish
Only the host SHALL finish a match, and only after every question has been opened and the current question is closed. The system SHALL persist the finished session before emitting `game:finish`. A second finish SHALL NOT persist again. If persistence fails, the room SHALL remain open and `game:finish` SHALL NOT be emitted. `finalLeaderboard` and `podium` SHALL exclude the host. Scores remain one point for a correct answer and zero for an incorrect or missing answer.

#### Scenario: Host finishes after the last closed question
- **WHEN** the host emits `game:finish` after every question index was opened and the active question is closed
- **THEN** the system stores the session and then emits `game:finish` with `finalLeaderboard` and `podium` excluding the host

#### Scenario: Premature or repeated finish
- **WHEN** a participant emits `game:finish`, a question is still open, a question has not been opened, or a finish is already in progress
- **THEN** the system rejects the request and does not write another finished session

#### Scenario: Persistence failure
- **WHEN** storing the finished session fails
- **THEN** the system does not emit `game:finish` and the room remains available
