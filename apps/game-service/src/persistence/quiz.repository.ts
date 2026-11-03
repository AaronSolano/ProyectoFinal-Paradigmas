import { Injectable } from "@nestjs/common";
import { Prisma, Question, Quiz } from "@profelink/game-prisma";
import { PrismaService } from "./prisma.service";

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
}
