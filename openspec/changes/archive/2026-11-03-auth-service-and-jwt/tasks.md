## 1. Project Initialization & Prisma Setup

- [x] 1.1 Scaffold NestJS application in `apps/auth-service` with TypeScript configuration.
- [x] 1.2 Define Prisma schema under `apps/auth-service/prisma/schema.prisma` targeting `schema = "auth"` with `User` model.
- [x] 1.3 Configure Prisma client generation and migration scripts.

## 2. Authentication Logic & JWT Issuance

- [x] 2.1 Implement `PasswordService` with bcrypt hashing and validation.
- [x] 2.2 Implement `UsersService` for user creation and lookup by email.
- [x] 2.3 Implement `AuthService` handling login, validating credentials, and signing JWT with `aud: "profelink-game-api"`.
- [x] 2.4 Implement `AuthController` with endpoints `POST /api/auth/register` and `POST /api/auth/login`.

## 3. OpenAPI & Scalar Documentation

- [x] 3.1 Configure NestJS Swagger / OpenAPI module in `apps/auth-service/src/main.ts`.
- [x] 3.2 Mount `@scalar/nestjs-api-reference` on route `/reference`.
- [x] 3.3 Annotate DTOs with `@ApiProperty` to document payload structures.

## 4. Seeding & Automated Tests

- [x] 4.1 Create database seed script `prisma/seed.ts` inserting `profe@profelink.cr` and `alumno@profelink.cr`.
- [x] 4.2 Write unit tests in Jest for password hashing and JWT payload structure.
- [x] 4.3 Write E2E / integration tests with Supertest verifying HTTP responses and JWT claims.

## 5. Dockerization & Container Integration

- [x] 5.1 Create multi-stage `Dockerfile` in `apps/auth-service/Dockerfile`.
- [x] 5.2 Add `auth-service` definition to `docker-compose.yml` exposing port 3001.
