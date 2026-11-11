import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { QuizRepository } from "../persistence/quiz.repository";
import { QuizLibraryService } from "../services/quiz-library.service";
import { QuizService } from "../services/quiz.service";
import { QuizLibraryController } from "./quiz-library.controller";
import { QuizController } from "./quiz.controller";
import { JwtAudienceStrategy } from "./strategies/jwt-audience.strategy";

const SECRET = "test-secret";
const AUDIENCE = "profelink-game-api";
const ISSUER = "profelink-auth-service";
const QUIZ_ID = "11111111-1111-4111-8111-111111111111";

describe("Quiz library HTTP", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const repo = {
    listPublished: jest.fn(),
    findPublishedWithQuestions: jest.fn(),
    copyPublished: jest.fn(),
    listQuizzesByOwner: jest.fn(),
    findQuizById: jest.fn(),
  };
  const host = { sub: "host-1", email: "profe@profelink.cr", role: "HOST" };
  const student = { sub: "s-1", email: "alumno@profelink.cr", role: "PARTICIPANT" };

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    process.env.JWT_AUDIENCE = AUDIENCE;
    process.env.JWT_ISSUER = ISSUER;
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({ secret: SECRET }),
      ],
      controllers: [QuizLibraryController, QuizController],
      providers: [
        QuizLibraryService,
        QuizService,
        JwtAudienceStrategy,
        { provide: QuizRepository, useValue: repo },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.resetAllMocks());

  const tokenFor = (payload: Record<string, unknown>) =>
    jwt.sign(payload, { secret: SECRET, audience: AUDIENCE, issuer: ISSUER, expiresIn: "1h" });
  const auth = (payload: Record<string, unknown>) => ({ Authorization: `Bearer ${tokenFor(payload)}` });

  it("returns 401 without a token", async () => {
    await request(app.getHttpServer()).get("/api/library/quizzes").expect(401);
    await request(app.getHttpServer()).get(`/api/library/quizzes/${QUIZ_ID}`).expect(401);
    await request(app.getHttpServer()).post(`/api/library/quizzes/${QUIZ_ID}/copy`).expect(401);
    expect(repo.listPublished).not.toHaveBeenCalled();
  });

  it("returns 403 to a participant on library and quiz CRUD routes", async () => {
    const h = auth(student);
    await request(app.getHttpServer()).get("/api/library/quizzes").set(h).expect(403);
    await request(app.getHttpServer()).get(`/api/library/quizzes/${QUIZ_ID}`).set(h).expect(403);
    await request(app.getHttpServer()).post(`/api/library/quizzes/${QUIZ_ID}/copy`).set(h).expect(403);
    await request(app.getHttpServer()).get("/api/quizzes").set(h).expect(403);
    await request(app.getHttpServer()).get(`/api/quizzes/${QUIZ_ID}/questions`).set(h).expect(403);
    await request(app.getHttpServer())
      .patch(`/api/quizzes/${QUIZ_ID}`)
      .set(h)
      .send({ published: true })
      .expect(403);
    expect(repo.listPublished).not.toHaveBeenCalled();
    expect(repo.findPublishedWithQuestions).not.toHaveBeenCalled();
    expect(repo.copyPublished).not.toHaveBeenCalled();
    expect(repo.listQuizzesByOwner).not.toHaveBeenCalled();
    expect(repo.findQuizById).not.toHaveBeenCalled();
  });

  it("filters by category and returns page, pageSize and total", async () => {
    repo.listPublished.mockResolvedValue({ items: [], total: 0 });

    const res = await request(app.getHttpServer())
      .get("/api/library/quizzes?category=ciencias&pageSize=20")
      .set(auth(host))
      .expect(200);

    expect(repo.listPublished).toHaveBeenCalledWith({ category: "ciencias", page: 1, pageSize: 20 });
    expect(res.body).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });
  });

  it("rejects an unknown category and a page size above 20", async () => {
    await request(app.getHttpServer()).get("/api/library/quizzes?category=musica").set(auth(host)).expect(400);
    await request(app.getHttpServer()).get("/api/library/quizzes?pageSize=21").set(auth(host)).expect(400);
    expect(repo.listPublished).not.toHaveBeenCalled();
  });

  it("returns 404 with no questions for a private or missing quiz", async () => {
    repo.findPublishedWithQuestions.mockResolvedValue(null);
    repo.copyPublished.mockResolvedValue(null);

    const detail = await request(app.getHttpServer())
      .get(`/api/library/quizzes/${QUIZ_ID}`)
      .set(auth(host))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/library/quizzes/${QUIZ_ID}/copy`)
      .set(auth(host))
      .expect(404);
    expect(detail.body.questions).toBeUndefined();
  });

  it("returns the questions with correct answers of a published quiz", async () => {
    repo.findPublishedWithQuestions.mockResolvedValue({
      id: QUIZ_ID,
      title: "Q",
      category: "historia",
      published: true,
      questions: [{ id: "x", statement: "S", correctAnswer: false }],
    });

    const res = await request(app.getHttpServer())
      .get(`/api/library/quizzes/${QUIZ_ID}`)
      .set(auth(host))
      .expect(200);

    expect(res.body.category).toBe("historia");
    expect(res.body.questions[0].correctAnswer).toBe(false);
  });

  it("copies a published quiz for the calling host", async () => {
    repo.copyPublished.mockResolvedValue({ id: "copy", ownerId: "host-1", category: null, published: false, questions: [] });

    await request(app.getHttpServer())
      .post(`/api/library/quizzes/${QUIZ_ID}/copy`)
      .set(auth(host))
      .expect(201);

    expect(repo.copyPublished).toHaveBeenCalledWith(QUIZ_ID, "host-1");
  });
});
