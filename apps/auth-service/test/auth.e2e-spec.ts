import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { UserRole } from "@profelink/auth-prisma";
import { config } from "dotenv";
import { resolve } from "path";
import request from "supertest";
import { AppModule } from "../src/app.module";

config({ path: resolve(__dirname, "../../../.env") });

describe("Auth API (e2e)", () => {
  let app: INestApplication;
  let jwt: JwtService;

  const uniqueEmail = () =>
    `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@profelink.cr`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/auth/register creates user without password hash", async () => {
    const email = uniqueEmail();
    const response = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        email,
        password: "Profelink123!",
        displayName: "E2E User",
        role: UserRole.PARTICIPANT,
      })
      .expect(201);

    expect(response.body.email).toBe(email);
    expect(response.body.displayName).toBe("E2E User");
    expect(response.body.role).toBe(UserRole.PARTICIPANT);
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.password).toBeUndefined();
  });

  it("POST /api/auth/register returns 409 for duplicate email", async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        email,
        password: "Profelink123!",
        displayName: "Dup User",
        role: UserRole.HOST,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        email,
        password: "Profelink123!",
        displayName: "Dup User 2",
        role: UserRole.HOST,
      })
      .expect(409);
  });

  it("POST /api/auth/login issues JWT with aud and iss", async () => {
    const email = uniqueEmail();
    const password = "Profelink123!";

    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        email,
        password,
        displayName: "Login User",
        role: UserRole.HOST,
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    expect(login.body.accessToken).toBeDefined();
    const decoded = jwt.decode(login.body.accessToken) as Record<string, unknown>;
    expect(decoded.aud).toBe(process.env.JWT_AUDIENCE ?? "profelink-game-api");
    expect(decoded.iss).toBe(process.env.JWT_ISSUER ?? "profelink-auth-service");
    expect(decoded.sub).toBe(login.body.user.id);
    expect(decoded.role).toBe(UserRole.HOST);
  });

  it("POST /api/auth/login returns 401 for invalid credentials", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "noexiste@profelink.cr",
        password: "Profelink123!",
      })
      .expect(401);
  });
});
