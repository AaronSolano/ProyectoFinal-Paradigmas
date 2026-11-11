import { Prisma } from "@profelink/game-prisma";
import { PrismaService } from "./prisma.service";
import { QuizRepository } from "./quiz.repository";

describe("QuizRepository.copyPublished", () => {
  const source = {
    id: "orig",
    ownerId: "owner-a",
    title: "Original",
    description: "d",
    category: "ciencias",
    published: true,
    questions: [
      { id: "q1", quizId: "orig", statement: "A", imageUrl: "/u/a.png", correctAnswer: true, timeLimitSeconds: 20, sortOrder: 0 },
      { id: "q2", quizId: "orig", statement: "B", imageUrl: null, correctAnswer: false, timeLimitSeconds: 30, sortOrder: 1 },
    ],
  };

  function build(found: unknown) {
    const tx = {
      quiz: {
        findFirst: jest.fn().mockResolvedValue(found),
        create: jest.fn().mockImplementation(async (args: Prisma.QuizCreateArgs) => args),
        update: jest.fn(),
        delete: jest.fn(),
      },
      question: { update: jest.fn(), delete: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    return { tx, repo: new QuizRepository(prisma as unknown as PrismaService) };
  }

  it("creates one new private quiz with new question rows inside a transaction", async () => {
    const { tx, repo } = build(source);

    await repo.copyPublished("orig", "owner-b");

    expect(tx.quiz.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "orig", published: true } }));
    const data = (tx.quiz.create.mock.calls[0][0] as Prisma.QuizCreateArgs).data as Record<string, any>;
    expect(data).toMatchObject({
      ownerId: "owner-b",
      title: "Original",
      category: "ciencias",
      published: false,
      sourceQuizId: "orig",
    });
    expect(data.id).toBeUndefined();
    expect(data.questions.create).toEqual([
      { statement: "A", imageUrl: "/u/a.png", correctAnswer: true, timeLimitSeconds: 20, sortOrder: 0 },
      { statement: "B", imageUrl: null, correctAnswer: false, timeLimitSeconds: 30, sortOrder: 1 },
    ]);
  });

  it("never writes to the original quiz or its questions", async () => {
    const { tx, repo } = build(source);

    await repo.copyPublished("orig", "owner-b");

    expect(tx.quiz.update).not.toHaveBeenCalled();
    expect(tx.quiz.delete).not.toHaveBeenCalled();
    expect(tx.question.update).not.toHaveBeenCalled();
    expect(tx.question.delete).not.toHaveBeenCalled();
  });

  it("returns null and creates nothing when the source is private or missing", async () => {
    const { tx, repo } = build(null);

    await expect(repo.copyPublished("orig", "owner-b")).resolves.toBeNull();
    expect(tx.quiz.create).not.toHaveBeenCalled();
  });
});
