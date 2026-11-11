## 1. Catalog persistence

- [x] 1.1 Add the `ChallengePrompt` Prisma model in the `game` schema, with a unique statement and indexes for category and difficulty.
- [x] 1.2 Add the migration for `game.challenge_prompts`. Applied locally with `prisma migrate deploy` after authorization.
- [x] 1.3 Fact-check and write 60 true-or-false challenges, 10 per category, 4/3/3 by difficulty, and 5 true plus 5 false answers per category, in an idempotent seed.
- [x] 1.4 Verify that one execution of the bank seed stores 60 unique statements, keeps the approved distribution, and does not change existing quiz questions.

## 2. Catalog API

- [x] 2.1 Add `GET /api/challenge-prompts` with text, category, difficulty, and pagination limited to 20 items.
- [x] 2.2 Restrict that query to `HOST` and return 401 without a token and 403 for `PARTICIPANT`.
- [x] 2.3 Add the transactional copy `POST /api/quizzes/{quizId}/questions/from-bank` for 1 to 20 identifiers.
- [x] 2.4 Reject unknown identifiers without partial writes, and reject a quiz the caller does not own.
- [x] 2.5 Add service tests for the filter, the role gate, the copy, and the rollback.

## 3. VeriX editor

- [x] 3.1 Add the teacher-home cards **Crea tu reto** and **Explora retos**, visible only to `HOST`.
- [x] 3.2 Implement quiz list, create, edit, and delete with the existing quiz endpoints.
- [x] 3.3 Implement manual true-or-false questions, including optional image upload and the existing validation messages.
- [x] 3.4 Implement catalog search, filters, preview of the correct answer, multi-select, and copy confirmation.
- [x] 3.5 Show empty, loading, and error states without clearing questions already saved in the quiz.
- [x] 3.6 Add Vitest coverage for the filter query, the selection limit, and the role gate of the two cards.
- [x] 3.7 Use a wide workspace for Crea tu reto and Explora retos, and keep ProfeLink out of the visible product name.
- [x] 3.8 Select the first loaded quiz locally, highlight the chosen card, and keep the explore selection action visible while long lists scroll internally.

## 4. Boundaries

- [x] 4.1 Leave Socket.IO, scoring, session results, and the auth service unchanged.
- [x] 4.2 Keep AI question generation out of the implementation.
