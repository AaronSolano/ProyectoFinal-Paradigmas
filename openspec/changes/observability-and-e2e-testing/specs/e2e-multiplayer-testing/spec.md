## Purpose

Especifica las pruebas automatizadas de extremo a extremo que validan el ciclo completo de juego sincrónico multi-usuario usando Playwright.

## ADDED Requirements

### Requirement: Multi-Browser Realtime Game Flow Test
The system SHALL provide an automated Playwright test suite that executes a full game lifecycle across independent browser contexts.

#### Scenario: Running full multiplayer game flow
- **WHEN** the Playwright test suite executes
- **THEN** it launches 1 Host browser and 2 Student browsers, joins the session using the generated PIN, answers True/False questions in parallel, and verifies that the podium renders accurately across all screens.
