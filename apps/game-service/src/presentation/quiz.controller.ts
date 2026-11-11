import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../entities/auth-user";
import { QuizService } from "../services/quiz.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { HostRoleGuard } from "./guards/host-role.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("quizzes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HostRoleGuard)
@Controller("quizzes")
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuizDto) {
    return this.quizService.createQuiz(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.quizService.listQuizzes(user);
  }

  @Get(":quizId")
  getOne(@CurrentUser() user: AuthUser, @Param("quizId") quizId: string) {
    return this.quizService.getQuiz(user, quizId);
  }

  @Patch(":quizId")
  update(
    @CurrentUser() user: AuthUser,
    @Param("quizId") quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizService.updateQuiz(user, quizId, dto);
  }

  @Delete(":quizId")
  remove(@CurrentUser() user: AuthUser, @Param("quizId") quizId: string) {
    return this.quizService.deleteQuiz(user, quizId);
  }

  @Get(":quizId/questions")
  listQuestions(@CurrentUser() user: AuthUser, @Param("quizId") quizId: string) {
    return this.quizService.listQuestions(user, quizId);
  }

  @Post(":quizId/questions")
  addQuestion(
    @CurrentUser() user: AuthUser,
    @Param("quizId") quizId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizService.addQuestion(user, quizId, dto);
  }

  @Patch(":quizId/questions/:questionId")
  updateQuestion(
    @CurrentUser() user: AuthUser,
    @Param("quizId") quizId: string,
    @Param("questionId") questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizService.updateQuestion(user, quizId, questionId, dto);
  }

  @Delete(":quizId/questions/:questionId")
  deleteQuestion(
    @CurrentUser() user: AuthUser,
    @Param("quizId") quizId: string,
    @Param("questionId") questionId: string,
  ) {
    return this.quizService.deleteQuestion(user, quizId, questionId);
  }
}

