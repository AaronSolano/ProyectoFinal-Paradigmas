# Proposal: Shared Quiz Library

## Why

Los profesores necesitan clasificar sus cuestionarios y, si lo deciden, compartir el cuestionario completo con otros profesores. El banco de preguntas individuales no cubre esa publicación ni la copia de un cuestionario entero.

## What Changes

- Agregar a `Quiz` una categoría opcional en la base, obligatoria en el formulario de un cuestionario nuevo, con estado privado por defecto y publicación explícita.
- Rechazar la publicación de un cuestionario sin preguntas.
- Reservar el CRUD de cuestionarios y preguntas al rol `HOST`.
- Consultar solo los cuestionarios publicados, filtrarlos por las mismas seis categorías y ver sus preguntas.
- Copiar un cuestionario publicado a otro profesor como filas nuevas de `Quiz` y `Question`.
- Conservar la regla de que solo el propietario edita o publica su cuestionario.
- Mantener `ChallengePrompt` como banco separado. No cambiar el motor de partida, la puntuación ni las sesiones.

## Capabilities

### New Capabilities
- `quiz-library`: Biblioteca de cuestionarios completos, privados por defecto, con publicación voluntaria y copia independiente.

### Modified Capabilities
<!-- None: no se reescriben los requisitos ya archivados de quiz-management. La autoría actual se reutiliza. -->

## Impact

- **Datos**: una migración aditiva posterior agrega columnas a `game.quizzes`. No modifica `20261110214500_challenge_prompts`.
- **API**: categoría y publicación en el CRUD del dueño; `GET /api/library/quizzes`, su detalle y `POST /api/library/quizzes/{quizId}/copy`.
- **Cliente**: selector de categoría, interruptor de publicación y pantalla de biblioteca, distintas de Explora retos.
- **Orden**: la migración del banco se aplica antes, porque la categoría del cuestionario reutiliza el tipo `ChallengeCategory`.
