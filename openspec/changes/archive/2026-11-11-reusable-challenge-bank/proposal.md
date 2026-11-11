# Proposal: Reusable Challenge Bank

## Why

El profesor necesita redactar sus propios retos y también incorporar preguntas reutilizables guardadas en PostgreSQL. Hoy cada pregunta pertenece a un solo cuestionario y no existe un banco consultable, filtrable ni copiable.

## What Changes

- Agregar el modelo `ChallengePrompt` en el esquema `game`, separado de `Question`.
- Publicar una consulta paginada para el rol `HOST`, con búsqueda por texto y filtros de categoría y dificultad.
- Copiar los retos elegidos a un cuestionario del profesor mediante filas `Question` nuevas, sin modificar el banco.
- Cargar un catálogo inicial de 60 afirmaciones de verdadero o falso, 30 verdaderas y 30 falsas, mediante un seed idempotente.
- Añadir en VeriX las experiencias **Crea tu reto** y **Explora retos** sobre los contratos existentes de cuestionarios y el contrato nuevo del banco.
- No generar preguntas con IA y no cambiar Socket.IO, autenticación, sesiones ni puntuación.

## Capabilities

### New Capabilities
- `challenge-bank`: Banco reutilizable de retos verdadero/falso, con consulta filtrada y copia independiente hacia un cuestionario.

### Modified Capabilities
<!-- None: quiz-management sigue siendo el CRUD de cuestionarios. Este cambio no reescribe sus requisitos. -->

## Impact

- **Datos**: `20261110214500_challenge_prompts` ya está aplicada en PostgreSQL local. El seed del banco cargó 60 retos en `game.challenge_prompts`.
- **API**: `GET /api/challenge-prompts` y `POST /api/quizzes/{quizId}/questions/from-bank`.
- **Cliente**: nuevas pantallas bajo `apps/web-client/src/features/quizzes` y `features/question-bank`.
- **Cambio existente**: `web-client-and-external-consumer` conserva el editor manual y la partida. El banco deja de planearse ahí como catálogo local.
- **Biblioteca**: los cuestionarios completos compartidos no forman parte de este cambio. Se planifican en `shared-quiz-library`.
