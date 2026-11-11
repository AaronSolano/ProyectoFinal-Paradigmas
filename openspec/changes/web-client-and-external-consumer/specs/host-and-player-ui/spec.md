## Purpose

Especifica la experiencia visible de VeriX para el profesor y el estudiante, desde el acceso hasta los resultados, usando los contratos HTTP y Socket.IO ya existentes.

## ADDED Requirements

### Requirement: VeriX commercial identity
The web client SHALL present VeriX as its visible product name on every screen. It MUST NOT present ProfeLink as the commercial name of the game. Package names, database schemas, the JWT audience `profelink-game-api`, and existing HTTP paths SHALL remain unchanged.

#### Scenario: Visible product name
- **WHEN** a person opens any VeriX screen
- **THEN** the visible title is VeriX and the screen does not introduce the game as ProfeLink

#### Scenario: Dark competitive presentation
- **WHEN** a host or student uses a VeriX screen on a phone or a desktop display
- **THEN** the screen uses a dark background, cyan and magenta neon accents, large cards and controls, and a layout that remains usable at both sizes

#### Scenario: Final podium emphasis
- **WHEN** a match finishes
- **THEN** the podium is visually emphasized rather than shown only as a plain administrative table

### Requirement: Authentication and role separation
The web client SHALL register and log in through the existing auth endpoints, attach the returned access token as a Bearer token, and separate the teacher area from the student area according to the `HOST` or `PARTICIPANT` role.

#### Scenario: Successful login
- **WHEN** a person submits a valid email and password
- **THEN** the client calls `POST /api/auth/login` and uses the returned access token for later authorized requests without placing the token in the URL

#### Scenario: Host area
- **WHEN** the authenticated role is `HOST`
- **THEN** the client opens the teacher panel and does not open the student answer controls

#### Scenario: Participant area
- **WHEN** the authenticated role is `PARTICIPANT`
- **THEN** the client opens student entry and does not open quiz creation or quiz editing

#### Scenario: Missing or rejected credentials
- **WHEN** login fails or a protected request returns HTTP 401
- **THEN** the client shows the sign-in state and does not show quizzes, live rooms, scores, or podium data

### Requirement: Teacher panel and manual true-or-false quizzes
A host SHALL list, create, edit, and delete quizzes, and SHALL manage true-or-false questions manually through the existing quiz endpoints. Each question SHALL have a statement, one boolean correct answer, and its own time limit. The accepted time limit is an integer from 5 to 120 seconds, inclusive. The editor SHALL reject a value outside that range with the message «El tiempo debe ser un entero entre 5 y 120 segundos.» An optional image SHALL be added only through the existing upload endpoint.

#### Scenario: Create a quiz and two questions
- **WHEN** a host creates a quiz and adds two true-or-false questions
- **THEN** the client sends `POST /api/quizzes` and `POST /api/quizzes/{quizId}/questions` with `statement`, `correctAnswer`, `timeLimitSeconds`, and optional `sortOrder`

#### Scenario: Edit and remove content
- **WHEN** a host changes or deletes a quiz or a question
- **THEN** the client uses the existing `PATCH` or `DELETE` quiz and question endpoints and shows the updated list

#### Scenario: Question time outside the allowed range
- **WHEN** a host enters 4 or 121 seconds for a question
- **THEN** the editor does not send the question and shows that the time must be an integer between 5 and 120 seconds

#### Scenario: Optional support image
- **WHEN** a host attaches a JPEG, PNG, or WebP image of at most 5 MB
- **THEN** the client sends it to `POST /api/upload` and stores the returned URL on the question

### Requirement: Host Game Projection and Moderation
The system SHALL provide a web interface for hosts to manage quizzes, display the room code returned by the API in the lobby, project active questions with images and a timer, and display the final podium. The displayed room code SHALL be the `roomCode` value, formatted as `PL-` followed by four characters. The lobby SHALL show that code, a client-generated QR code that opens the student join screen for the same code, and live participant updates.

#### Scenario: Displaying room lobby
- **WHEN** a host creates a game session from a quiz
- **THEN** the interface displays the returned room code, a QR code for the student join screen, join instructions, and live updates of joined participants

#### Scenario: Question presentation
- **WHEN** the host triggers question start
- **THEN** the projector view renders the question statement, support image when present, a countdown derived from `expiresAt`, and the answer count without showing `correctAnswer`

### Requirement: Responsive Participant True/False Gameplay
The system SHALL provide a mobile-responsive interface for participants with large True and False response controls.

#### Scenario: Joining a game room
- **WHEN** a student enters a valid room code and display name
- **THEN** the application joins the room with `room:join` and displays a waiting screen until the host starts the first question

#### Scenario: Submitting binary answer
- **WHEN** a question opens and the participant chooses Verdadero or Falso
- **THEN** the interface disables further input, sends `game:submit_answer` with the boolean answer, and shows the acknowledgment until the question closes

### Requirement: Synchronized live session
The web client SHALL connect to the game socket with the access token and SHALL advance the match from server events. The host SHALL start a question, close it, and finish the match. A participant SHALL submit at most one answer for the open question. Reconnection SHALL restore the room from `room:state_sync`.

#### Scenario: Host opens and closes a question
- **WHEN** the host starts a question and later closes that same question index
- **THEN** the client emits `game:start_question` and `game:close_question`, and renders the matching `game:question_opened` and `game:question_results` payloads

#### Scenario: Participant feedback
- **WHEN** `game:question_results` arrives after a participant answer
- **THEN** the participant sees whether the submitted answer matches `correctAnswer`, the current score, and the ranking

#### Scenario: Confirmed finish after the last question
- **WHEN** the server reports that no further question index exists and the host confirms the finish
- **THEN** the client emits `game:finish` once and renders `finalLeaderboard` from that event, without calculating ranks locally

#### Scenario: Finish rejected by the server
- **WHEN** the server responds to `game:finish` with an `exception`
- **THEN** the client shows that message and does not present the match as finished

#### Scenario: Final ranking and podium
- **WHEN** the host finishes the match
- **THEN** the client waits for `game:finish` and shows `podium` and `finalLeaderboard` for that room code. Missing podium places stay empty. Ranks and scores stay in the server order, including ties. The host is absent. After the socket drops, the same result stays on screen. The host can return to the teacher panel and the student can return to the student start without another `game:finish`.

#### Scenario: Student reconnects
- **WHEN** a connected participant loses the socket and connects again with the same room code
- **THEN** the client emits `room:join` again and restores the waiting, active-question, or closed-question screen from `room:state_sync` without granting a second answer to an already answered question

### Requirement: Historical results inside VeriX
An authenticated host or participant SHALL review finished sessions through the existing session endpoints. VeriX SHALL NOT read the database directly. A 404 response SHALL be shown as a missing session and SHALL NOT reveal names, scores, or podium.

#### Scenario: List visible finished sessions
- **WHEN** an authenticated user opens historical results
- **THEN** the client requests `GET /api/sessions` and shows the room code, completion time, display names, final scores, and rank returned for that user

#### Scenario: Open one visible session
- **WHEN** the user opens a finished room returned in that list
- **THEN** the client requests `GET /api/sessions/{roomCode}` and shows that session podium

#### Scenario: Session is not visible
- **WHEN** the session detail responds with HTTP 404
- **THEN** the client states that the session was not found and does not render participants, scores, or podium

#### Scenario: Missed finish after disconnect
- **WHEN** a person already in the room loses the socket before `game:finish` and the live room no longer exists
- **THEN** the client requests `GET /api/sessions/{roomCode}` with the bearer token and, on HTTP 200, shows that session podium and `participants` as the final ranking

#### Scenario: Unfinished room after disconnect
- **WHEN** that same request responds with HTTP 404
- **THEN** the client does not invent a ranking and keeps the room unavailable

#### Scenario: Historical view without a token
- **WHEN** the results screen has no access token
- **THEN** the client returns to sign-in and does not display session data

### Requirement: Preloaded question bank stays after the primary flow
The primary VeriX flow SHALL let a host create true-or-false questions manually. The client SHALL NOT require a preloaded question bank to create a quiz, join a room, answer, finish a match, or read historical results, and SHALL NOT generate questions with AI.

#### Scenario: Playable flow without a bank
- **WHEN** a host and a student complete login, quiz editing, a live match, and historical results
- **THEN** none of those screens calls a question-bank or AI generation endpoint

#### Scenario: Reusable catalog is outside this change
- **WHEN** a host uses the manual quiz editor in this change
- **THEN** the editor creates questions through the existing question endpoint and does not implement the persistent catalog defined by `reusable-challenge-bank`
