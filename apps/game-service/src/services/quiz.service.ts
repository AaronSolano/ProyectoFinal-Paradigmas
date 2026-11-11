import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Question, Quiz } from "@profelink/game-prisma";
import { AuthUser } from "../entities/auth-user";
import { CATEGORY_CODE_TO_ENUM, QuizView, toQuizView } from "../persistence/quiz-category";
import { QuizRepository } from "../persistence/quiz.repository";
import { CreateQuestionDto } from "../presentation/dto/create-question.dto";
import { CreateQuizDto } from "../presentation/dto/create-quiz.dto";
import { UpdateQuestionDto } from "../presentation/dto/update-question.dto";
import { UpdateQuizDto } from "../presentation/dto/update-quiz.dto";
import { assertHost } from "./host-access";

@Injectable()
export class QuizService {
  constructor(private readonly quizzes: QuizRepository) {}

  async createQuiz(user: AuthUser, dto: CreateQuizDto): Promise<QuizView> {
    assertHost(user);
    const quiz = await this.quizzes.createQuiz({
      title: dto.title,
      description: dto.description,
      category: dto.category ? CATEGORY_CODE_TO_ENUM[dto.category] : undefined,
      published: false,
      ownerId: user.userId,
    });
    return toQuizView(quiz);
  }

  async listQuizzes(user: AuthUser): Promise<QuizView[]> {
    assertHost(user);
    const quizzes = await this.quizzes.listQuizzesByOwner(user.userId);
    return quizzes.map(toQuizView);
  }

  async getQuiz(user: AuthUser, quizId: string): Promise<QuizView> {
    return toQuizView(await this.getOwnedQuiz(user, quizId));
  }

  async updateQuiz(user: AuthUser, quizId: string, dto: UpdateQuizDto): Promise<QuizView> {
    assertHost(user);
    const quiz = await this.requireQuiz(quizId);
    this.assertOwner(user, quiz);

    const data: Prisma.QuizUpdateInput = {
      title: dto.title,
      description: dto.description,
      category: dto.category ? CATEGORY_CODE_TO_ENUM[dto.category] : undefined,
    };
    if (dto.published === true && !quiz.published) {
      if ((await this.quizzes.countQuestions(quizId)) === 0) {
        throw new BadRequestException(
          "No se puede publicar un cuestionario sin preguntas.",
        );
      }
      data.published = true;
      data.publishedAt = new Date();
    } else if (dto.published === false && quiz.published) {
      data.published = false;
      data.publishedAt = null;
    }
    return toQuizView(await this.quizzes.updateQuiz(quizId, data));
  }

  async deleteQuiz(user: AuthUser, quizId: string): Promise<QuizView> {
    assertHost(user);
    const quiz = await this.requireQuiz(quizId);
    this.assertOwner(user, quiz);
    return toQuizView(await this.quizzes.deleteQuiz(quizId));
  }

  async listQuestions(user: AuthUser, quizId: string): Promise<Question[]> {
    await this.getOwnedQuiz(user, quizId);
    return this.quizzes.listQuestionsByQuiz(quizId);
  }

  async addQuestion(
    user: AuthUser,
    quizId: string,
    dto: CreateQuestionDto,
  ): Promise<Question> {
    assertHost(user);
    await this.getOwnedQuiz(user, quizId);
    return this.quizzes.createQuestion({
      quiz: { connect: { id: quizId } },
      statement: dto.statement,
      imageUrl: dto.imageUrl,
      correctAnswer: dto.correctAnswer,
      timeLimitSeconds: dto.timeLimitSeconds,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async updateQuestion(
    user: AuthUser,
    quizId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ): Promise<Question> {
    assertHost(user);
    await this.getOwnedQuiz(user, quizId);
    const question = await this.requireQuestion(questionId, quizId);
    return this.quizzes.updateQuestion(question.id, {
      statement: dto.statement,
      imageUrl: dto.imageUrl,
      correctAnswer: dto.correctAnswer,
      timeLimitSeconds: dto.timeLimitSeconds,
      sortOrder: dto.sortOrder,
    });
  }

  async deleteQuestion(
    user: AuthUser,
    quizId: string,
    questionId: string,
  ): Promise<Question> {
    assertHost(user);
    await this.getOwnedQuiz(user, quizId);
    const question = await this.requireQuestion(questionId, quizId);
    return this.quizzes.deleteQuestion(question.id);
  }

  private async getOwnedQuiz(user: AuthUser, quizId: string): Promise<Quiz> {
    assertHost(user);
    const quiz = await this.requireQuiz(quizId);
    this.assertOwner(user, quiz);
    return quiz;
  }

  private async requireQuiz(quizId: string): Promise<Quiz> {
    const quiz = await this.quizzes.findQuizById(quizId);
    if (!quiz) {
      throw new NotFoundException("Cuestionario no encontrado.");
    }
    return quiz;
  }

  private async requireQuestion(
    questionId: string,
    quizId: string,
  ): Promise<Question> {
    const question = await this.quizzes.findQuestionById(questionId);
    if (!question || question.quizId !== quizId) {
      throw new NotFoundException("Pregunta no encontrada.");
    }
    return question;
  }

  private assertOwner(user: AuthUser, quiz: Quiz): void {
    if (quiz.ownerId !== user.userId) {
      throw new ForbiddenException("No tiene permiso para modificar este cuestionario.");
    }
  }
}




