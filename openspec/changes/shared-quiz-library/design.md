## Context

`Quiz` hoy guarda título, descripción y `ownerId`. `Question` pertenece a un solo cuestionario. Actualizar o borrar un cuestionario ajeno ya responde 403. Crear un cuestionario no pide categoría ni visibilidad. El banco individual vive en `reusable-challenge-bank` y su migración todavía no está aplicada. Véase `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Clasificar un cuestionario con una de las seis categorías del banco.
- Dejarlo privado hasta que su dueño lo publique.
- Permitir que otro profesor copie un cuestionario publicado sin compartir filas.

**Non-Goals:**
- No cambia `ChallengePrompt` ni la migración ya preparada.
- No cambia Socket.IO, la puntuación ni el cierre de sesiones.
- No exige categoría a los cuestionarios que ya existan. El formulario de uno nuevo sí la exige.
- No cambia la autorización de la sala en vivo.
- No permite a un estudiante explorar la biblioteca.

## Decisions

### 1. Ampliar `Quiz`, sin tabla paralela
- **Decisión**: `Quiz` gana `category` opcional, `published` con valor inicial `false`, `publishedAt` opcional y `sourceQuizId` opcional. La relación de origen usa `ON DELETE SET NULL`.
- **Racional**: el cuestionario publicado es el mismo recurso que el privado. Una tabla duplicada obligaría a sincronizar dos copias maestras.
- **Alternativa descartada**: publicar mediante filas `ChallengePrompt`. Mezclaría preguntas sueltas con cuestionarios completos.

### 2. Misma categoría, migración aparte
- **Decisión**: `category` usa el tipo `game.ChallengeCategory` creado por `20261110214500_challenge_prompts`. La biblioteca espera a que esa migración se aplique y después agrega columnas a `game.quizzes`. Los cuestionarios actuales quedan con categoría nula y `published = false`.
- **Racional**: no se reescribe la migración del banco y las seis categorías no se duplican.
- **Alternativa descartada**: un texto libre. Permitiría categorías distintas de las del banco.

### 3. Publicar es una acción del dueño con rol HOST
- **Decisión**: el formulario de un cuestionario nuevo exige una de las seis categorías y no envía la creación si falta. La columna sigue siendo opcional para los cuestionarios antiguos. `POST /api/quizzes` guarda el cuestionario como privado. `PATCH /api/quizzes/{quizId}` permite al dueño cambiar título, descripción, categoría y `published`. Publicar exige el rol `HOST` y al menos una pregunta; si no hay preguntas, responde 400 y el cuestionario sigue privado. El CRUD de cuestionarios y preguntas exige `HOST`. Un `PARTICIPANT` recibe 403. Quien no sea dueño también recibe 403.
- **Racional**: la categoría no puede quedar vacía en un cuestionario nuevo, pero las filas anteriores siguen siendo válidas. La publicación vacía no aporta un cuestionario reutilizable. Hoy el CRUD solo compara `ownerId`, así que un estudiante puede crear cuestionarios.

### 4. La biblioteca solo muestra lo publicado
- **Decisión**: `GET /api/library/quizzes` devuelve cuestionarios con `published = true`, filtrados por categoría y paginados de a 20 como máximo. El detalle incluye las preguntas y su respuesta correcta. Un cuestionario privado responde 404 en estas rutas. `PARTICIPANT` recibe 403. Sin token, 401.
- **Racional**: el listado del dueño sigue siendo `GET /api/quizzes`. La biblioteca no revela borradores.

### 5. La copia es independiente
- **Decisión**: `POST /api/library/quizzes/{quizId}/copy` crea, en una transacción, un `Quiz` nuevo y preguntas nuevas. La copia queda privada, conserva la categoría y guarda `sourceQuizId`. Editarla o borrarla no modifica el original. Borrar el original no borra las copias.
- **Racional**: `Question` no puede compartirse entre cuestionarios sin dejar de ser una fila propia.
- **Alternativa descartada**: clonar solo el identificador del cuestionario. Cualquier edición afectaría a los demás.

## Risks / Trade-offs

- **[Riesgo: el CRUD actual no comprueba el rol HOST]** → **Mitigación**: el CRUD de cuestionarios y preguntas, la publicación, la biblioteca y la copia exigirán `HOST`. `POST /api/quizzes/{quizId}/sessions` sigue comprobando solo la propiedad del cuestionario; esa ruta pertenece al motor de sala y no cambia en este diseño.
- **[Riesgo: la categoría depende del tipo creado por otra migración]** → **Mitigación**: se aplica primero `20261110214500_challenge_prompts` y después la migración de columnas. No se edita el SQL ya preparado.
- **[Riesgo: una sala ya abierta no refleja una edición posterior]** → **Mitigación**: se conserva el comportamiento actual. La sala usa la copia de preguntas tomada al crearla.
- **[Riesgo: la imagen copiada apunta al mismo archivo]** → **Mitigación**: se copia la URL, no se comparte la fila. Borrar un cuestionario hoy no borra el archivo.

## Migration Plan

Después de autorizar la implementación, agregar una migración que solo haga `ALTER TABLE` sobre `game.quizzes`. No ejecutarla en esta etapa. El rollback es eliminar esas columnas si todavía no hay copias que dependan de ellas.

## Open Questions

Ninguna.
