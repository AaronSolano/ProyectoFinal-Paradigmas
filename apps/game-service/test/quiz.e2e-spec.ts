import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { config } from "dotenv";
import { resolve } from "path";
import request from "supertest";
import { AppModule } from "../src/app.module";

config({ path: resolve(__dirname, "../../../.env") });

describe("Game service quizzes & upload (e2e)", () => {
  let app: INestApplication;
  let jwt: JwtService;

  const secret = process.env.JWT_SECRET ?? "change-me-use-a-long-random-secret-in-production";
  const issuer = process.env.JWT_ISSUER ?? "profelink-auth-service";
  const audience = process.env.JWT_AUDIENCE ?? "profelink-game-api";

  const ownerA = {
    sub: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email: "owner-a@profelink.cr",
    role: "HOST",
  };
  const ownerB = {
    sub: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    email: "owner-b@profelink.cr",
    role: "HOST",
  };

  const tokenFor = (payload: Record<string, unknown>, aud = audience) =>
    jwt.sign(payload, { secret, issuer, audience: aud, expiresIn: "1h" });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api", { exclude: ["uploads/(.*)"] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects protected route when aud is wrong", async () => {
    const badToken = tokenFor(ownerA, "wrong-audience");
    await request(app.getHttpServer())
      .get("/api/quizzes")
      .set("Authorization", `Bearer ${badToken}`)
      .expect(401);
  });

  it("creates quiz, question, upload image, and enforces ownership", async () => {
    const tokenA = tokenFor(ownerA);
    const tokenB = tokenFor(ownerB);

    const created = await request(app.getHttpServer())
      .post("/api/quizzes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Quiz E2E", description: "demo" })
      .expect(201);

    const quizId = created.body.id as string;
    expect(created.body.ownerId).toBe(ownerA.sub);

    await request(app.getHttpServer())
      .patch(`/api/quizzes/${quizId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "Hack" })
      .expect(403);

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );

    const upload = await request(app.getHttpServer())
      .post("/api/upload")
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", png, { filename: "dot.png", contentType: "image/png" })
      .expect(201);

    const imageUrl = upload.body.url as string;

    const question = await request(app.getHttpServer())
      .post(`/api/quizzes/${quizId}/questions`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        statement: "NestJS es un framework backend.",
        correctAnswer: true,
        timeLimitSeconds: 20,
        imageUrl,
      })
      .expect(201);

    expect(question.body.quizId).toBe(quizId);

    await request(app.getHttpServer())
      .get(`/api/quizzes/${quizId}/questions`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .delete(`/api/quizzes/${quizId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);
  });
});
