import { Injectable } from "@nestjs/common";
import { Prisma, Question, Quiz } from "@profelink/game-prisma";
import { PrismaService } from "./prisma.service";
import { CATEGORY_CODE_TO_ENUM } from "./quiz-category";
import { ChallengeCategoryCode } from "./challenge-bank.catalog";

@Injectable()
export class QuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  createQuiz(data: Prisma.QuizCreateInput): Promise<Quiz> {
    return this.prisma.quiz.create({ data });
  }

  findQuizById(id: string): Promise<Quiz | null> {
    return this.prisma.quiz.findUnique({ where: { id } });
  }

  listQuizzesByOwner(ownerId: string): Promise<Quiz[]> {
    return this.prisma.quiz.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
    });
  }

  updateQuiz(id: string, data: Prisma.QuizUpdateInput): Promise<Quiz> {
    return this.prisma.quiz.update({ where: { id }, data });
  }

  deleteQuiz(id: string): Promise<Quiz> {
    return this.prisma.quiz.delete({ where: { id } });
  }

  createQuestion(data: Prisma.QuestionCreateInput): Promise<Question> {
    return this.prisma.question.create({ data });
  }

  findQuestionById(id: string): Promise<Question | null> {
    return this.prisma.question.findUnique({ where: { id } });
  }

  listQuestionsByQuiz(quizId: string): Promise<Question[]> {
    return this.prisma.question.findMany({
      where: { quizId },
      orderBy: { sortOrder: "asc" },
    });
  }

  updateQuestion(id: string, data: Prisma.QuestionUpdateInput): Promise<Question> {
    return this.prisma.question.update({ where: { id }, data });
  }

  deleteQuestion(id: string): Promise<Question> {
    return this.prisma.question.delete({ where: { id } });
  }

  countQuestions(quizId: string): Promise<number> {
    return this.prisma.question.count({ where: { quizId } });
  }

  async listPublished(query: {
    category?: ChallengeCategoryCode;
    page: number;
    pageSize: number;
  }): Promise<{ items: Array<Quiz & { questionCount: number }>; total: number }> {
    const where: Prisma.QuizWhereInput = {
      published: true,
      ...(query.category ? { category: CATEGORY_CODE_TO_ENUM[query.category] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { _count: { select: { questions: true } } },
      }),
      this.prisma.quiz.count({ where }),
    ]);
    const items = rows.map(({ _count, ...quiz }) => ({
      ...quiz,
      questionCount: _count.questions,
    }));
    return { items, total };
  }

  findPublishedWithQuestions(id: string): Promise<(Quiz & { questions: Question[] }) | null> {
    return this.prisma.quiz.findFirst({
      where: { id, published: true },
      include: { questions: { orderBy: { sortOrder: "asc" } } },
    });
  }

  /**
   * Copies a published quiz and its questions into new private rows owned by
   * `ownerId`, atomically. Returns null when the source is not published.
   */
  copyPublished(
    sourceId: string,
    ownerId: string,
  ): Promise<(Quiz & { questions: Question[] }) | null> {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.quiz.findFirst({
        where: { id: sourceId, published: true },
        include: { questions: { orderBy: { sortOrder: "asc" } } },
      });
      if (!source) {
        return null;
      }
      return tx.quiz.create({
        data: {
          ownerId,
          title: source.title,
          description: source.description,
          category: source.category,
          published: false,
          sourceQuizId: source.id,
          questions: {
            create: source.questions.map((q) => ({
              statement: q.statement,
              imageUrl: q.imageUrl,
              correctAnswer: q.correctAnswer,
              timeLimitSeconds: q.timeLimitSeconds,
              sortOrder: q.sortOrder,
            })),
          },
        },
        include: { questions: { orderBy: { sortOrder: "asc" } } },
      });
    });
  }
}
