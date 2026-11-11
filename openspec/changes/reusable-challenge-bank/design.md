## Context

`Question` exige `quizId` y se elimina en cascada con el cuestionario. El CRUD ya permite a su dueño crear, editar y borrar preguntas con enunciado, respuesta booleana, tiempo mínimo de 5 segundos e imagen opcional. La carga de imagen acepta JPEG, PNG o WebP de hasta 5 MB y devuelve `{ url }`. Ver `proposal.md` para el motivo. El cambio `web-client-and-external-consumer` sigue dueño del editor manual, la sala y los resultados.

## Goals / Non-Goals

**Goals:**
- Persistir un banco compartido que el profesor pueda buscar, filtrar, previsualizar y copiar.
- Copiar cada reto como una `Question` independiente.
- Mantener el motor de partida leyendo solo las preguntas del cuestionario.
- Sembrar 60 retos, 10 por categoría, sin duplicarlos si el seed se repite.

**Non-Goals:**
- No edita ni borra el banco desde VeriX.
- No incluye la biblioteca de cuestionarios completos. Esa capacidad queda en `shared-quiz-library`.
- No genera preguntas con IA.
- No cambia JWT, CORS, Socket.IO, puntuación ni resultados históricos.
- No convierte `Question` en fila compartida entre cuestionarios.
- No ejecuta la migración ni el seed en esta etapa.

## Decisions

### 1. Tabla propia `challenge_prompts`
- **Decisión**: el modelo `ChallengePrompt` vive en el esquema `game` y no tiene relación Prisma con `Quiz`. Campos: `statement`, `correctAnswer`, `category`, `difficulty`, `suggestedTimeLimitSeconds` e `imageUrl` opcional. `statement` es único.
- **Racional**: una `Question` no puede ser reutilizable sin dejar de pertenecer a un cuestionario.
- **Alternativa descartada**: guardar el banco en memoria o en un JSON del cliente. No cumpliría la persistencia pedida.

### 2. Categorías y dificultad estables
- **Decisión**: las categorías son `cultura-general`, `ciencias`, `tecnologia`, `historia`, `geografia` y `deportes`. La dificultad es `facil`, `intermedia` o `dificil`. La interfaz muestra los nombres en español.
- **Racional**: los filtros quedan cerrados y el seed no inventa categorías nuevas.
- **Distribución**: 10 retos por categoría, con 4 fáciles, 3 intermedios y 3 difíciles, y 5 respuestas verdaderas y 5 falsas en cada categoría. Una respuesta falsa se obtiene reescribiendo la afirmación, no invirtiendo el booleano de un enunciado que sigue siendo verdadero.

### 3. Consulta paginada solo para HOST
- **Decisión**: `GET /api/challenge-prompts` exige el JWT de audiencia `profelink-game-api` y el rol `HOST`. Acepta `q`, `category`, `difficulty`, `page` y `pageSize`. `page` empieza en 1. `pageSize` tiene máximo 20 y valor inicial 12. `q`, si viene, busca por contiene sin distinguir mayúsculas y exige al menos 2 caracteres. La respuesta incluye `items`, `page`, `pageSize` y `total`. Cada item muestra enunciado, respuesta correcta, categoría, dificultad y tiempo sugerido.
- **Racional**: la vista previa del profesor necesita la respuesta correcta. Un estudiante no debe recibir ese catálogo.
- **Alternativa descartada**: reutilizar `GET /api/quizzes`, que solo lista los cuestionarios del dueño.

### 4. Copia transaccional
- **Decisión**: `POST /api/quizzes/{quizId}/questions/from-bank` recibe `{ promptIds: string[] }`, con entre 1 y 20 identificadores distintos. El caller debe ser `HOST` y dueño del cuestionario. En una transacción se crean `Question` nuevas copiando enunciado, respuesta, imagen y tiempo sugerido. El `sortOrder` continúa después del máximo existente. Si falta un identificador o la selección trae duplicados, no se escribe ninguna fila. Los registros del banco permanecen iguales.
- **Racional**: el motor ya carga `Question` por `sortOrder` al crear la sala. La copia entra a la partida sin tocar Socket.IO.
- **Alternativa descartada**: llamar veinte veces al POST actual desde el navegador. Un fallo intermedio dejaría una copia parcial.

### 5. Seed idempotente
- **Decisión**: `apps/game-service/prisma/challenge-bank.seed.ts` hace upsert por `statement`. Repetirlo actualiza categoría, dificultad, respuesta y tiempo, y no crea otra fila. No modifica cuestionarios ya copiados.
- **Racional**: el seed de auth ya mostró que un upsert puede no tocar todos los campos. Aquí el conflicto es el enunciado y sí se actualizan los atributos del banco.

### 6. Experiencia VeriX
- **Decisión**: la mesa del profesor muestra dos tarjetas, **Crea tu reto** y **Explora retos**. La primera usa el CRUD existente. La segunda solo se abre con un `quizId` y confirma cuántos retos se incorporaron. En pantallas anchas, los controles quedan en una columna y el contenido en otra, dentro de un marco que usa casi todo el ancho. Al cargar, si no hay una selección válida, el cliente marca el primer cuestionario solo en memoria. La tarjeta y **Editar** cambian esa selección; **Eliminar** queda como acción secundaria y pide confirmación. En **Explora retos**, el contador y **Incorporar selección** permanecen fijos en el lateral, y los listados largos se desplazan dentro de su panel. El nombre visible es VeriX. Un nombre de cuenta que contiene ProfeLink no se imprime; el correo de demostración y los identificadores técnicos (`@profelink/*`, `profelink-game-api`, rutas `/api`) permanecen. No hay dependencias nuevas.
- **Racional**: ambas acciones pertenecen al mismo editor y comparten la lista de preguntas del cuestionario. Una sola columna dejaba vacío la mayor parte del escritorio.

## Risks / Trade-offs

- **[Riesgo: el CRUD actual no comprueba el rol HOST]** → **Mitigación**: crear, editar y borrar cuestionarios o preguntas, abrir una sala y consultar o copiar el banco exigen `HOST`. Un `PARTICIPANT` sigue pudiendo consultar sus resultados y unirse a una sala.
- **[Riesgo: una sala ya creada no ve las copias posteriores]** → **Mitigación**: la interfaz explica que los retos entran en la próxima sala. La sala en memoria conserva su copia inicial.
- **[Riesgo: un enunciado incorrecto en el seed]** → **Mitigación**: las 60 afirmaciones ya fueron revisadas, equilibradas y cargadas una vez. Si un enunciado cambia después, el upsert lo trata como una fila nueva porque la clave es el texto.
- **[Riesgo: dos enunciados iguales en categorías distintas]** → **Mitigación**: la unicidad es el enunciado completo. Se redactan para que no colisionen.

## Migration Plan

La migración `20261110214500_challenge_prompts` ya fue aplicada en PostgreSQL local con `prisma migrate deploy`, y el seed del banco ya cargó las 60 afirmaciones. El rollback es eliminar esa tabla si todavía no se ha usado la copia. Las preguntas ya copiadas permanecerían en `questions`.

## Open Questions

Ninguna. El catálogo exacto se redacta en la tarea de seed, no como una duda de arquitectura.
