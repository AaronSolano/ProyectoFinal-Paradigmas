import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ChallengeCategory, ChallengeDifficulty } from "@profelink/game-prisma";
import { AuthUser } from "../entities/auth-user";
import {
  ChallengeBankRepository,
  MissingChallengePromptsError,
} from "../persistence/challenge-bank.repository";
import { PrismaService } from "../persistence/prisma.service";
import { QuizRepository } from "../persistence/quiz.repository";
import { ChallengeBankService } from "./challenge-bank.service";

const PROMPT_A = "11111111-1111-4111-8111-111111111111";
const PROMPT_B = "22222222-2222-4222-8222-222222222222";

const host: AuthUser = { userId: "host-1", email: "profe@profelink.cr", role: "HOST" };
const student: AuthUser = { userId: "student-1", email: "alumno@profelink.cr", role: "PARTICIPANT" };

function prompt(id: string, statement: string) {
  return Object.freeze({
    id,
    statement,
    correctAnswer: false,
    category: ChallengeCategory.cultura_general,
    difficulty: ChallengeDifficulty.facil,
    suggestedTimeLimitSeconds: 20,
    imageUrl: "/uploads/luna.webp",
    createdAt: new Date("2026-11-10T00:00:00.000Z"),
    updatedAt: new Date("2026-11-10T00:00:00.000Z"),
  });
}

describe("ChallengeBankService", () => {
  const promptUpdate = jest.fn();
  const promptDelete = jest.fn();
  const findMany = jest.fn();
  const count = jest.fn();
  const findQuizById = jest.fn();
  let transactionCreates: unknown[];
  let service: ChallengeBankService;

  beforeEach(() => {
    jest.resetAllMocks();
    transactionCreates = [];
    const prisma = {
      challengePrompt: { findMany, count, update: promptUpdate, delete: promptDelete },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        const staged: unknown[] = [];
        const tx = {
          challengePrompt: { findMany, update: promptUpdate, delete: promptDelete },
          question: {
            aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 4 } }),
            create: jest.fn(async (args: { data: Record<string, unknown> }) => {
              if (staged.length === 1 && findMany.mock.calls.length > 0 && args.data.statement === "falla") {
                throw new Error("fallo de escritura");
              }
              staged.push(args.data);
              return { id: `question-${staged.length}`, quizId: "quiz-1", ...args.data };
            }),
          },
        };
        try {
          return await callback(tx);
        } catch (error) {
          staged.length = 0;
          throw error;
        } finally {
          transactionCreates = [...staged];
        }
      }),
    };
    service = new ChallengeBankService(
      new ChallengeBankRepository(prisma as unknown as PrismaService),
      { findQuizById } as unknown as QuizRepository,
    );
  });

  it("filters by text, category and difficulty with a stable page", async () => {
    findMany.mockResolvedValue([prompt(PROMPT_A, "Una hora tiene cien minutos.")]);
    count.mockResolvedValue(1);

    const result = await service.search(host, {
      q: "hora",
      category: "cultura-general",
      difficulty: "facil",
      page: 2,
      pageSize: 10,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          statement: { contains: "hora", mode: "insensitive" },
          category: ChallengeCategory.cultura_general,
          difficulty: ChallengeDifficulty.facil,
        },
        orderBy: [{ statement: "asc" }, { id: "asc" }],
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toEqual({
      items: [
        {
          id: PROMPT_A,
          statement: "Una hora tiene cien minutos.",
          correctAnswer: false,
          category: "cultura-general",
          difficulty: "facil",
          suggestedTimeLimitSeconds: 20,
          imageUrl: "/uploads/luna.webp",
        },
      ],
      page: 2,
      pageSize: 10,
      total: 1,
    });
    expect(promptUpdate).not.toHaveBeenCalled();
    expect(promptDelete).not.toHaveBeenCalled();
  });

  it("returns an empty page when nothing matches", async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    await expect(service.search(host, { q: "zz", page: 1, pageSize: 12 })).resolves.toEqual({
      items: [],
      page: 1,
      pageSize: 12,
      total: 0,
    });
  });

  it("rejects a participant before reading the catalog", async () => {
    await expect(service.search(student, {})).rejects.toBeInstanceOf(ForbiddenException);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("copies the selected prompts after the current sort order and leaves the bank unchanged", async () => {
    findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: host.userId });
    findMany.mockResolvedValue([
      prompt(PROMPT_A, "Una hora tiene cien minutos."),
      prompt(PROMPT_B, "Lyon es la capital de Francia."),
    ]);

    const created = await service.copyIntoQuiz(host, "quiz-1", {
      promptIds: [PROMPT_B, PROMPT_A],
    });

    expect(created.map((question) => question.sortOrder)).toEqual([5, 6]);
    expect(created.map((question) => question.statement)).toEqual([
      "Lyon es la capital de Francia.",
      "Una hora tiene cien minutos.",
    ]);
    expect(created[0]).toMatchObject({
      correctAnswer: false,
      imageUrl: "/uploads/luna.webp",
      timeLimitSeconds: 20,
    });
    expect(promptUpdate).not.toHaveBeenCalled();
    expect(promptDelete).not.toHaveBeenCalled();
  });

  it("writes nothing when a selected prompt does not exist", async () => {
    findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: host.userId });
    findMany.mockResolvedValue([prompt(PROMPT_A, "Una hora tiene cien minutos.")]);

    await expect(
      service.copyIntoQuiz(host, "quiz-1", { promptIds: [PROMPT_A, PROMPT_B] }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transactionCreates).toEqual([]);
    expect(promptUpdate).not.toHaveBeenCalled();
  });

  it("discards partial question creates when the transaction fails", async () => {
    findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: host.userId });
    findMany.mockResolvedValue([
      prompt(PROMPT_A, "Una hora tiene cien minutos."),
      { ...prompt(PROMPT_B, "Lyon es la capital de Francia."), statement: "falla" },
    ]);

    await expect(
      service.copyIntoQuiz(host, "quiz-1", { promptIds: [PROMPT_A, PROMPT_B] }),
    ).rejects.toThrow("fallo de escritura");
    expect(transactionCreates).toEqual([]);
    expect(promptUpdate).not.toHaveBeenCalled();
    expect(promptDelete).not.toHaveBeenCalled();
  });

  it("rejects duplicates, a missing quiz, another owner's quiz, and a participant", async () => {
    await expect(
      service.copyIntoQuiz(host, "quiz-1", { promptIds: [PROMPT_A, PROMPT_A] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    findQuizById.mockResolvedValue(null);
    await expect(
      service.copyIntoQuiz(host, "quiz-1", { promptIds: [PROMPT_A] }),
    ).rejects.toBeInstanceOf(NotFoundException);

    findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: "other" });
    await expect(
      service.copyIntoQuiz(host, "quiz-1", { promptIds: [PROMPT_A] }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.copyIntoQuiz(student, "quiz-1", { promptIds: [PROMPT_A] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("maps a missing prompt error from the repository", async () => {
    findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: host.userId });
    const repository = {
      search: jest.fn(),
      copyPrompts: jest.fn().mockRejectedValue(new MissingChallengePromptsError()),
    };
    const mapped = new ChallengeBankService(
      repository as unknown as ChallengeBankRepository,
      { findQuizById } as unknown as QuizRepository,
    );

    await expect(mapped.copyIntoQuiz(host, "quiz-1", { promptIds: [PROMPT_A] })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
