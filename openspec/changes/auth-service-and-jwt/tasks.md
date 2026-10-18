## 1. Project Initialization & Prisma Setup

- [ ] 1.1 Scaffold NestJS application in `apps/auth-service` with TypeScript configuration.
- [ ] 1.2 Define Prisma schema under `apps/auth-service/prisma/schema.prisma` targeting `schema = "auth"` with `User` model.
- [ ] 1.3 Configure Prisma client generation and migration scripts.

## 2. Authentication Logic & JWT Issuance

- [ ] 2.1 Implement `PasswordService` with bcrypt hashing and validation.
- [ ] 2.2 Implement `UsersService` for user creation and lookup by email.
- [ ] 2.3 Implement `AuthService` handling login, validating credentials, and signing JWT with `aud: "profelink-game-api"`.
- [ ] 2.4 Implement `AuthController` with endpoints `POST /api/auth/register` and `POST /api/auth/login`.

## 3. OpenAPI & Scalar Documentation

- [ ] 3.1 Configure NestJS Swagger / OpenAPI module in `apps/auth-service/src/main.ts`.
- [ ] 3.2 Mount `@scalar/nestjs-api-reference` on route `/reference`.
- [ ] 3.3 Annotate DTOs with `@ApiProperty` to document payload structures.

## 4. Seeding & Automated Tests

- [ ] 4.1 Create database seed script `prisma/seed.ts` inserting `profe@profelink.cr` and `alumno@profelink.cr`.
- [ ] 4.2 Write unit tests in Jest for password hashing and JWT payload structure.
- [ ] 4.3 Write E2E / integration tests with Supertest verifying HTTP responses and JWT claims.

## 5. Dockerization & Container Integration

- [ ] 5.1 Create multi-stage `Dockerfile` in `apps/auth-service/Dockerfile`.
- [ ] 5.2 Add `auth-service` definition to `docker-compose.yml` exposing port 3001.
