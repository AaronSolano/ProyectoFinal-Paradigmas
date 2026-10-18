## 1. Game Service Scaffolding & Layer Structure

- [ ] 1.1 Scaffold NestJS in `apps/game-service` following Layered Architecture folders (`presentation`, `services`, `persistence`, `entities`).
- [ ] 1.2 Define Prisma schema under `apps/game-service/prisma/schema.prisma` targeting `schema = "game"` with `Quiz` and `Question` models.
- [ ] 1.3 Configure database migrations and Prisma service in `persistence/`.

## 2. Security Layer: JWT Audience Guard

- [ ] 2.1 Implement `JwtAudienceStrategy` and `JwtAudienceGuard` validating signature and `aud: "profelink-game-api"`.
- [ ] 2.2 Write unit tests verifying that tokens with missing or incorrect `aud` are rejected with 401.

## 3. Quiz & Question Domain & Persistence

- [ ] 3.1 Implement `QuizRepository` in `persistence/` for database interactions.
- [ ] 3.2 Implement `QuizService` in `services/` enforcing author ownership and validation.
- [ ] 3.3 Implement `QuizController` in `presentation/` exposing CRUD endpoints for quizzes and questions.

## 4. Media Storage Layer

- [ ] 4.1 Implement `LocalStorageService` handling file writing to `/app/uploads` and UUID generation.
- [ ] 4.2 Implement `UploadController` with multer interceptors filtering by MIME type and size limit ($\le 5\text{MB}$).
- [ ] 4.3 Configure static asset serving for `/uploads` route in `main.ts`.

## 5. Documentation & Verification

- [ ] 5.1 Mount Scalar OpenAPI documentation on `apps/game-service/src/main.ts` at `/reference`.
- [ ] 5.2 Create multi-stage `Dockerfile` and configure volume mount `quiz_images` in `docker-compose.yml`.
- [ ] 5.3 Write integration tests for Quiz CRUD and Image Upload using Supertest.
