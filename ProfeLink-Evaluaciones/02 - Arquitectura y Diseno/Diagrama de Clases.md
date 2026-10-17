---
title: "Diagrama de Clases y Máquina de Estados"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - diagramas
  - uml
  - clases
  - maquina-de-estados
  - clean-architecture
---

# 📐 Diagrama de Clases y Máquina de Estados

Este documento formaliza el modelo de clases de la capa de dominio de `game-service` y el ciclo de vida de una sesión de juego mediante una máquina de estados finitos.

---

## 🏛️ 1. Diagrama de Clases del Dominio

```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String email
        +String passwordHash
        +DateTime createdAt
    }

    class Quiz {
        +UUID id
        +UUID ownerId
        +String title
        +String description
        +DateTime createdAt
        +canBeModifiedBy(userId: UUID) bool
        +addQuestion(question: Question) void
        +removeQuestion(questionId: UUID) void
    }

    class Question {
        +UUID id
        +UUID quizId
        +String statement
        +String imageUrl
        +Boolean correctAnswer
        +Int timeLimitSeconds
        +Int orderIndex
        +validateAnswer(answer: bool) bool
    }

    class GameSession {
        +UUID id
        +String roomCode
        +UUID quizId
        +UUID hostId
        +SessionStatus status
        +Int currentQuestionIndex
        +DateTime questionExpiresAt
        +DateTime startedAt
        +DateTime finishedAt
        +startSession(hostId: UUID) void
        +openQuestion(questionIndex: int) QuestionView
        +submitAnswer(userId: UUID, questionId: UUID, answer: bool, now: DateTime) AnswerResult
        +closeCurrentQuestion() RoundSummary
        +reconnectPlayer(userId: UUID, socketId: String) StateSyncPayload
        +finishGame() Leaderboard
    }

    class SessionParticipant {
        +UUID id
        +UUID sessionId
        +UUID userId
        +String displayName
        +Int totalScore
        +Boolean isConnected
        +String currentSocketId
        +addPoint() void
        +updateConnection(connected: bool, socketId: String) void
    }

    class ParticipantAnswer {
        +UUID id
        +UUID sessionId
        +UUID questionId
        +UUID participantId
        +Boolean submittedAnswer
        +Boolean isCorrect
        +Int pointsAwarded
        +DateTime answeredAt
    }

    class SessionStatus {
        <<enumeration>>
        WAITING
        QUESTION_ACTIVE
        QUESTION_CLOSED
        FINISHED
    }

    User "1" --> "*" Quiz : crea
    Quiz "1" *-- "1..*" Question : contiene
    Quiz "1" --> "*" GameSession : se juega en
    GameSession "1" *-- "*" SessionParticipant : tiene
    SessionParticipant "1" --> "*" ParticipantAnswer : responde
    Question "1" --> "*" ParticipantAnswer : recibe
    GameSession --> SessionStatus : estado
```

---

## 🔄 2. Máquina de Estados de la Sala de Juego (`GameSession`)

El comportamiento de la partida se modela estrictamente a través de transiciones de estado deterministas:

```mermaid
stateDiagram-v2
    [*] --> WAITING : Host crea la sala (POST /api/sessions)
    
    note right of WAITING
        - Jugadores se unen con PIN (room:join).
        - Se muestra lista en Lobby del Anfitrión.
        - No se admiten respuestas.
    end note

    WAITING --> QUESTION_ACTIVE : Host emite 'game:start_question'
    
    state QUESTION_ACTIVE {
        [*] --> TimerRunning : Inicia temporizador en servidor
        TimerRunning --> AcceptingAnswers : Jugadores envían 'game:submit_answer'
        AcceptingAnswers --> Validating : Servidor valida tiempo y unicidad
    }

    note right of QUESTION_ACTIVE
        - Pregunta proyectada sin 'correctAnswer'.
        - Temporizador decrementa.
        - Respuestas fuera de tiempo son descartadas.
    end note

    QUESTION_ACTIVE --> QUESTION_CLOSED : Expira tiempo O Host emite 'game:close_question'
    
    note right of QUESTION_CLOSED
        - Se revela la respuesta correcta (V o F).
        - Se calculan y transmiten estadísticas y podio parcial.
        - No se reciben más respuestas para esta pregunta.
    end note

    QUESTION_CLOSED --> QUESTION_ACTIVE : Host emite siguiente pregunta (hay más)
    QUESTION_CLOSED --> FINISHED : Host emite 'game:finish' (última pregunta)

    note right of FINISHED
        - Se proyecta el podio final (Top 3/5).
        - Se persisten los resultados consolidados en PostgreSQL.
        - Se desconectan los sockets de la sala.
    end note

    FINISHED --> [*]
```

---

## ⚙️ 3. Métodos Clave y Lógica Interna

### `GameSession.openQuestion(questionIndex: number)`
- **Validación:** `this.status` debe ser `WAITING` o `QUESTION_CLOSED`.
- **Efectos:**
  - `this.currentQuestionIndex = questionIndex`.
  - `this.status = SessionStatus.QUESTION_ACTIVE`.
  - `this.questionExpiresAt = new Date(Date.now() + question.timeLimitSeconds * 1000)`.
- **Salida:** Payload de socket `game:question_opened` sanitizado (sin revelar `correctAnswer`).

### `GameSession.submitAnswer(...)`
- **Validación:**
  1. `this.status === SessionStatus.QUESTION_ACTIVE`.
  2. `now <= this.questionExpiresAt`.
  3. `!this.answeredUsers.has(userId)`.
- **Efectos:**
  - Registra a `userId` en `answeredUsers`.
  - Determina si `answer === question.correctAnswer`.
  - Si es correcto, incrementa `participant.totalScore += 1`.
- **Salida:** `{ isCorrect: boolean, points: number }`.

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Modelo de Datos (ERD)|Ver Esquema de Base de Datos]]
- [[Diseno Interno (Arquitectura en Capas - Layers)|Ver Arquitectura en Capas (Layers)]]
- [[03 - Contratos y Especificaciones/Eventos WebSockets (Socket.io)|Ver Eventos de Socket.io]]
