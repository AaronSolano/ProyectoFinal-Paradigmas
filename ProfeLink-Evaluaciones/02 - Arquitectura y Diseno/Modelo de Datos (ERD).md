---
title: "Modelo de Datos: Esquema Relacional (ERD)"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - base-de-datos
  - erd
  - postgresql
  - prisma
  - arquitectura
---

# 🗄️ Modelo de Datos: Esquema Relacional (ERD)

Este documento detalla la estructura relacional de la base de datos PostgreSQL, los esquemas de separación lógica entre `auth-service` y `game-service`, y los tipos de datos requeridos para garantizar la persistencia de usuarios, cuestionarios, sesiones y estadísticas históricas.

---

## 📊 Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    USERS ||--o{ QUIZZES : "crea (ownerId)"
    USERS ||--o{ GAME_SESSIONS : "organiza (hostId)"
    USERS ||--o{ SESSION_PARTICIPANTS : "participa como (userId)"
    
    QUIZZES ||--|{ QUESTIONS : "contiene (quizId)"
    QUIZZES ||--o{ GAME_SESSIONS : "se juega en (quizId)"
    
    GAME_SESSIONS ||--|{ SESSION_PARTICIPANTS : "registra (sessionId)"
    GAME_SESSIONS ||--o{ PARTICIPANT_ANSWERS : "consolida (sessionId)"
    
    SESSION_PARTICIPANTS ||--o{ PARTICIPANT_ANSWERS : "envia (participantId)"
    QUESTIONS ||--o{ PARTICIPANT_ANSWERS : "recibe respuesta (questionId)"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string display_name
        string role "HOST | PARTICIPANT"
        datetime created_at
        datetime updated_at
    }

    QUIZZES {
        uuid id PK
        uuid owner_id FK
        string title
        text description
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        text statement
        string image_url "Opcional / Persistida"
        boolean correct_answer
        int time_limit_seconds "Default 30"
        int order_index
        datetime created_at
    }

    GAME_SESSIONS {
        uuid id PK
        string room_code UK "6 caracteres alfanumericos"
        uuid quiz_id FK
        uuid host_id FK
        string status "WAITING | ACTIVE | CLOSED | FINISHED"
        int current_question_index
        datetime question_expires_at
        datetime started_at
        datetime finished_at
    }

    SESSION_PARTICIPANTS {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        string display_name
        int total_score "Suma de puntos"
        boolean is_connected
        datetime joined_at
    }

    PARTICIPANT_ANSWERS {
        uuid id PK
        uuid session_id FK
        uuid question_id FK
        uuid participant_id FK
        boolean submitted_answer
        boolean is_correct
        int points_awarded "1 o 0"
        int response_time_ms
        datetime answered_at
    }
```

---

## 📑 Diccionario de Datos

### 1. Tabla `users` (Gestionada por `auth-service`)
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default `gen_random_uuid()` | Identificador universal único del usuario. |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico institucional o personal. |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash criptográfico (bcrypt/argon2). |
| `display_name` | VARCHAR(100) | NOT NULL | Nombre y apellido que se mostrará en las salas de juego. |
| `role` | VARCHAR(20) | NOT NULL, Default `'PARTICIPANT'` | Rol asignado (`HOST` para docentes, `PARTICIPANT` para alumnos). |
| `created_at` | TIMESTAMPTZ | NOT NULL, Default `NOW()` | Fecha y hora de registro. |

### 2. Tabla `quizzes` (Gestionada por `game-service`)
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador del cuestionario. |
| `owner_id` | UUID | NOT NULL | Referencia al `users.id` del docente creador. |
| `title` | VARCHAR(150) | NOT NULL | Título del quiz (ej. "Evaluación 1: Programación Funcional"). |
| `description` | TEXT | NULL | Contexto o instrucciones generales. |
| `created_at` | TIMESTAMPTZ | NOT NULL | Fecha de creación. |

### 3. Tabla `questions` (Gestionada por `game-service`)
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador de la pregunta. |
| `quiz_id` | UUID | FK `quizzes.id`, ON DELETE CASCADE | Cuestionario al que pertenece. |
| `statement` | TEXT | NOT NULL | Enunciado de la pregunta. |
| `image_url` | VARCHAR(500) | NULL | Ruta pública de la imagen de apoyo (`/uploads/...`). |
| `correct_answer`| BOOLEAN | NOT NULL | Valor booleano verdadero (`true`) o falso (`false`). |
| `time_limit_seconds` | INT | NOT NULL, Default `30` | Límite de tiempo otorgado para responder. |
| `order_index` | INT | NOT NULL | Secuencia ordinal de aparición en la partida. |

### 4. Tabla `game_sessions` (Gestionada por `game-service`)
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador de la sesión de juego. |
| `room_code` | VARCHAR(8) | UNIQUE, NOT NULL | Código PIN para unirse (ej. `PL-4921`). |
| `quiz_id` | UUID | FK `quizzes.id` | Cuestionario seleccionado. |
| `host_id` | UUID | NOT NULL | Docente anfitrión moderador. |
| `status` | VARCHAR(20) | NOT NULL | Estado actual de la sala (`WAITING`, `ACTIVE`, `FINISHED`). |
| `started_at` | TIMESTAMPTZ | NULL | Momento en que el anfitrión dio inicio. |
| `finished_at`| TIMESTAMPTZ | NULL | Momento en que concluyó la última pregunta. |

### 5. Tabla `session_participants`
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador del jugador en esta sesión. |
| `session_id` | UUID | FK `game_sessions.id`, ON DELETE CASCADE | Sala a la que pertenece. |
| `user_id` | UUID | NOT NULL | Identificador del usuario. |
| `display_name` | VARCHAR(100) | NOT NULL | Nombre proyectado en el podio. |
| `total_score` | INT | NOT NULL, Default `0` | Sumatoria final de respuestas acertadas a tiempo. |
| `is_connected`| BOOLEAN | NOT NULL, Default `TRUE` | Estado de conexión en tiempo real. |

### 6. Tabla `participant_answers`
| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador del registro de respuesta. |
| `session_id` | UUID | FK `game_sessions.id` | Partida en curso. |
| `question_id`| UUID | FK `questions.id` | Pregunta evaluada. |
| `participant_id`| UUID | FK `session_participants.id` | Jugador que contestó. |
| `submitted_answer` | BOOLEAN | NOT NULL | Elección enviada (`true` o `false`). |
| `is_correct` | BOOLEAN | NOT NULL | Evaluación calculada por el servidor. |
| `points_awarded` | INT | NOT NULL | $1$ si acertó a tiempo, $0$ si falló o expiró. |
| `answered_at`| TIMESTAMPTZ | NOT NULL | Timestamp oficial del servidor. |

> [!important] Restricción de Unicidad (Anti-Double Voting)
> Para salvaguardar la integridad de la base de datos frente a condiciones de carrera, se aplica un índice único compuesto:
> ```sql
> CREATE UNIQUE INDEX uq_participant_question ON participant_answers (session_id, question_id, participant_id);
> ```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Diagrama de Clases|Ver Diagrama de Clases del Dominio]]
- [[Diseno Interno (Arquitectura en Capas - Layers)|Diseño Interno: Arquitectura en Capas (Layers)]]
- [[04 - Infraestructura y Despliegue/Docker y Compose|Persistencia con Volúmenes en Docker]]
