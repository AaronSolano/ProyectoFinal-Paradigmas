import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test } from "@nestjs/testing";
import { ChallengeCategory, ChallengeDifficulty } from "@profelink/game-prisma";
import request from "supertest";
import {
  ChallengeBankRepository,
  MissingChallengePromptsError,
} from "../persistence/challenge-bank.repository";
import { QuizRepository } from "../persistence/quiz.repository";
import { ChallengeBankService } from "../services/challenge-bank.service";
import { ChallengeCopyController } from "./challenge-copy.controller";
import { ChallengePromptController } from "./challenge-prompt.controller";
import { JwtAudienceStrategy } from "./strategies/jwt-audience.strategy";

const SECRET = "test-secret";
const AUDIENCE = "profelink-game-api";
const ISSUER = "profelink-auth-service";
const PROMPT_A = "11111111-1111-4111-8111-111111111111";
const PROMPT_B = "22222222-2222-4222-8222-222222222222";

describe("Challenge bank HTTP", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const bank = { search: jest.fn(), copyPrompts: jest.fn() };
  const quizzes = { findQuizById: jest.fn() };
  const host = { sub: "host-1", email: "profe@profelink.cr", role: "HOST" };
  const student = { sub: "student-1", email: "alumno@profelink.cr", role: "PARTICIPANT" };

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
      controllers: [ChallengePromptController, ChallengeCopyController],
      providers: [
        ChallengeBankService,
        JwtAudienceStrategy,
        { provide: ChallengeBankRepository, useValue: bank },
        { provide: QuizRepository, useValue: quizzes },
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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  function tokenFor(payload: Record<string, unknown>): string {
    return jwt.sign(payload, { secret: SECRET, audience: AUDIENCE, issuer: ISSUER, expiresIn: "1h" });
  }

  it("returns 401 without a token", async () => {
    await request(app.getHttpServer()).get("/api/challenge-prompts").expect(401);
    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .send({ promptIds: [PROMPT_A] })
      .expect(401);
    expect(bank.search).not.toHaveBeenCalled();
    expect(bank.copyPrompts).not.toHaveBeenCalled();
  });

  it("returns 403 for a participant and does not reveal prompts", async () => {
    await request(app.getHttpServer())
      .get("/api/challenge-prompts")
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ promptIds: [PROMPT_A] })
      .expect(403);
    expect(bank.search).not.toHaveBeenCalled();
    expect(quizzes.findQuizById).not.toHaveBeenCalled();
  });

  it("returns the filtered page for a host", async () => {
    bank.search.mockResolvedValue({
      items: [
        {
          id: PROMPT_A,
          statement: "Una hora tiene cien minutos.",
          correctAnswer: false,
          category: ChallengeCategory.cultura_general,
          difficulty: ChallengeDifficulty.facil,
          suggestedTimeLimitSeconds: 20,
          imageUrl: null,
        },
      ],
      total: 1,
    });

    const response = await request(app.getHttpServer())
      .get("/api/challenge-prompts")
      .query({ q: "hora", category: "cultura-general", difficulty: "facil", page: 1, pageSize: 12 })
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .expect(200);

    expect(response.body).toEqual({
      items: [
        {
          id: PROMPT_A,
          statement: "Una hora tiene cien minutos.",
          correctAnswer: false,
          category: "cultura-general",
          difficulty: "facil",
          suggestedTimeLimitSeconds: 20,
          imageUrl: null,
        },
      ],
      page: 1,
      pageSize: 12,
      total: 1,
    });
    expect(response.body.items[0]).not.toHaveProperty("createdAt");
  });

  it("returns an empty list when the host search matches nothing", async () => {
    bank.search.mockResolvedValue({ items: [], total: 0 });

    const response = await request(app.getHttpServer())
      .get("/api/challenge-prompts")
      .query({ q: "zz" })
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .expect(200);

    expect(response.body).toEqual({ items: [], page: 1, pageSize: 12, total: 0 });
  });

  it("returns 400 for invalid query parameters", async () => {
    const auth = { Authorization: `Bearer ${tokenFor(host)}` };
    await request(app.getHttpServer()).get("/api/challenge-prompts").query({ q: "a" }).set(auth).expect(400);
    await request(app.getHttpServer())
      .get("/api/challenge-prompts")
      .query({ category: "magia" })
      .set(auth)
      .expect(400);
    await request(app.getHttpServer())
      .get("/api/challenge-prompts")
      .query({ pageSize: 21 })
      .set(auth)
      .expect(400);
    expect(bank.search).not.toHaveBeenCalled();
  });

  it("returns 400 when the selection is empty, duplicated, or longer than 20", async () => {
    const auth = { Authorization: `Bearer ${tokenFor(host)}` };
    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set(auth)
      .send({ promptIds: [] })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set(auth)
      .send({ promptIds: [PROMPT_A, PROMPT_A] })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set(auth)
      .send({
        promptIds: Array.from({ length: 21 }, (_, index) =>
          `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        ),
      })
      .expect(400);
    expect(bank.copyPrompts).not.toHaveBeenCalled();
  });

  it("returns 404 when the quiz or a prompt does not exist", async () => {
    const auth = { Authorization: `Bearer ${tokenFor(host)}` };
    quizzes.findQuizById.mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set(auth)
      .send({ promptIds: [PROMPT_A] })
      .expect(404);

    quizzes.findQuizById.mockResolvedValueOnce({ id: "quiz-1", ownerId: "host-1" });
    bank.copyPrompts.mockRejectedValueOnce(new MissingChallengePromptsError());
    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set(auth)
      .send({ promptIds: [PROMPT_A, PROMPT_B] })
      .expect(404);
    expect(bank.copyPrompts).toHaveBeenCalledTimes(1);
  });

  it("returns 403 when the host does not own the quiz", async () => {
    quizzes.findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: "other" });

    await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .send({ promptIds: [PROMPT_A] })
      .expect(403);
    expect(bank.copyPrompts).not.toHaveBeenCalled();
  });

  it("copies the selection for the owner", async () => {
    quizzes.findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: "host-1" });
    bank.copyPrompts.mockResolvedValue([
      { id: "question-1", statement: "Lyon es la capital de Francia.", sortOrder: 0 },
    ]);

    const response = await request(app.getHttpServer())
      .post("/api/quizzes/quiz-1/questions/from-bank")
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .send({ promptIds: [PROMPT_A] })
      .expect(201);

    expect(bank.copyPrompts).toHaveBeenCalledWith("quiz-1", [PROMPT_A]);
    expect(response.body).toEqual([
      { id: "question-1", statement: "Lyon es la capital de Francia.", sortOrder: 0 },
    ]);
  });
});
