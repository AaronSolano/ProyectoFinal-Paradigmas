## Purpose

Permite al profesor consultar un banco persistente de retos verdadero/falso y copiar los que elija a un cuestionario propio, sin modificar los retos originales ni el motor de la partida.

## ADDED Requirements

### Requirement: Persistent reusable challenge catalog
The game-service SHALL store reusable true-or-false challenges in PostgreSQL, separate from quiz questions. Each stored challenge SHALL have one statement, one boolean correct answer, one category, one difficulty, and a suggested time limit of at least 5 seconds. The allowed categories SHALL be `cultura-general`, `ciencias`, `tecnologia`, `historia`, `geografia`, and `deportes`. The allowed difficulties SHALL be `facil`, `intermedia`, and `dificil`.

#### Scenario: Catalog is stored independently
- **WHEN** a challenge exists in the catalog
- **THEN** it remains stored when a quiz or a copied quiz question is deleted

### Requirement: Host can search and filter the catalog
The system SHALL allow only an authenticated `HOST` with audience `profelink-game-api` to query the catalog. The query SHALL support text search, category, difficulty, and pagination. A page SHALL contain at most 20 challenges. Each returned challenge SHALL include its statement, correct answer, category, difficulty, and suggested time limit.

#### Scenario: Filtered page
- **WHEN** a host queries the catalog with a category, a difficulty, and a text fragment of at least 2 characters
- **THEN** the system returns HTTP 200 with only matching challenges, the requested page, the page size, and the total count

#### Scenario: Empty search
- **WHEN** a host query matches nothing
- **THEN** the system returns HTTP 200 with an empty item list and a total of 0

#### Scenario: Student queries the catalog
- **WHEN** an authenticated `PARTICIPANT` requests the catalog
- **THEN** the system returns HTTP 403 and no challenge statements or answers

#### Scenario: Query without a token
- **WHEN** the catalog is requested without a Bearer token
- **THEN** the system returns HTTP 401

### Requirement: Copy selected challenges into a quiz
The system SHALL copy one to twenty selected catalog challenges into a quiz owned by the requesting host. Each copy SHALL become a new quiz question with the same statement, correct answer, image URL when present, and suggested time limit. The copy SHALL NOT change the catalog record. If any selected identifier does not exist, the system SHALL write no question.

#### Scenario: Successful copy
- **WHEN** a host selects several existing challenges for a quiz that the host owns
- **THEN** the system creates that many new quiz questions and the catalog rows keep their original values

#### Scenario: Unknown challenge in the selection
- **WHEN** the selection contains an identifier that is not in the catalog
- **THEN** the system rejects the request and the quiz question count stays unchanged

#### Scenario: Quiz belongs to someone else
- **WHEN** a host requests a copy into a quiz owned by another user
- **THEN** the system returns HTTP 403 and creates no question

#### Scenario: Repeated identifier in one request
- **WHEN** the selection contains the same challenge identifier more than once
- **THEN** the system rejects the request and creates no question

### Requirement: Teacher mutations require the host role
Creating, updating, or deleting a quiz or one of its questions, and creating a live session, SHALL require role `HOST`. An authenticated `PARTICIPANT` SHALL receive HTTP 403 and the system SHALL NOT write that resource. Reading finished session results and joining a live room SHALL remain available to a participant.

#### Scenario: Participant edits a quiz
- **WHEN** an authenticated `PARTICIPANT` creates, updates, or deletes a quiz or question
- **THEN** the system returns HTTP 403 and writes nothing

#### Scenario: Participant starts a room
- **WHEN** an authenticated `PARTICIPANT` requests a new live session
- **THEN** the system returns HTTP 403 and does not open a room

### Requirement: Idempotent factual seed
The initial catalog SHALL contain 60 challenges, 10 in each allowed category, with 4 easy, 3 intermediate, and 3 difficult challenges in every category. Each category SHALL contain 5 true answers and 5 false answers. Repeating the seed SHALL NOT create a second row for the same statement. The seed SHALL NOT generate challenges with AI.

#### Scenario: Balanced answers
- **WHEN** the initial catalog is loaded
- **THEN** it contains 30 true answers and 30 false answers, with 5 of each in every category

#### Scenario: Seed runs twice
- **WHEN** the catalog seed is executed again after the 60 challenges exist
- **THEN** the catalog still contains one row per statement

### Requirement: VeriX create and explore experience
The teacher home SHALL offer **Crea tu reto** and **Explora retos** as two visible VeriX cards. Manual creation SHALL use the existing quiz and question endpoints. Exploration SHALL query the catalog and copy the selected challenges into the open quiz. A participant SHALL NOT see either card.

#### Scenario: Manual question
- **WHEN** a host saves a new question with a statement, a boolean answer, and a time limit of at least 5 seconds
- **THEN** the editor sends the existing create-question request and shows the question in that quiz

#### Scenario: Explore and add
- **WHEN** a host selects challenges in Explora retos and confirms
- **THEN** the editor shows those challenges as questions of the current quiz and shows how many were added

#### Scenario: Empty catalog result
- **WHEN** the active filters match no challenges
- **THEN** the explore screen says that nothing matched and does not clear the quiz questions

#### Scenario: Wide editor workspace
- **WHEN** a host opens Crea tu reto or Explora retos
- **THEN** the screen uses the available width, keeps the quiz controls beside the working area on a wide display, and does not present ProfeLink as a visible product name

#### Scenario: First quiz is selected locally
- **WHEN** Crea tu reto loads one or more quizzes and the current selection is missing
- **THEN** the editor selects the first quiz in memory, highlights it, and shows its questions and question controls without creating or updating a record

#### Scenario: Choose a quiz card
- **WHEN** a host activates a quiz card or its Editar button
- **THEN** that quiz becomes the highlighted selection and its questions appear in the right panel

#### Scenario: Explore selection stays visible
- **WHEN** a host browses a long catalog in Explora retos on a desktop display
- **THEN** the selection count and Incorporar selección stay visible in the side panel while the long list scrolls inside its own area
