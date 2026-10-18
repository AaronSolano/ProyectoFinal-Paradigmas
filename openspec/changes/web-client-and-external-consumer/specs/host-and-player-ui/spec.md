## Purpose

Especifica los requerimientos funcionales y de interacción visual para las aplicaciones web del docente y de los estudiantes.

## ADDED Requirements

### Requirement: Host Game Projection and Moderation
The system SHALL provide a web interface for hosts to manage quizzes, display the room PIN in the lobby, project active questions with images and timer, and display final podiums.

#### Scenario: Displaying room lobby
- **WHEN** a host creates a game session from a quiz
- **THEN** the interface displays the 6-character room PIN, QR code / join instructions, and live updates of joined participants.

#### Scenario: Question presentation
- **WHEN** the host triggers question start
- **THEN** the projector view renders the question statement, support image, countdown timer, and answer count without showing the correct answer.

### Requirement: Responsive Participant True/False Gameplay
The system SHALL provide a mobile-responsive interface for participants with high-contrast True and False response controls.

#### Scenario: Joining a game room
- **WHEN** a student enters a valid room PIN and display name
- **THEN** the application joins the room via WebSocket and displays a waiting screen until the host starts the first question.

#### Scenario: Submitting binary answer
- **WHEN** a question opens and the participant taps "Verdadero" or "Falso"
- **THEN** the interface disables further input, sends `game:submit_answer`, and shows an acknowledgment status pending question closure.
