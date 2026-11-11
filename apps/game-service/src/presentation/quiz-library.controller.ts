import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../entities/auth-user";
import { QuizLibraryService } from "../services/quiz-library.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LibraryQuizQueryDto } from "./dto/library-quiz-query.dto";
import { HostRoleGuard } from "./guards/host-role.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("library")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HostRoleGuard)
@Controller("library/quizzes")
export class QuizLibraryController {
  constructor(private readonly library: QuizLibraryService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: LibraryQuizQueryDto) {
    return this.library.list(user, query);
  }

  @Get(":quizId")
  detail(@CurrentUser() user: AuthUser, @Param("quizId", ParseUUIDPipe) quizId: string) {
    return this.library.detail(user, quizId);
  }

  @Post(":quizId/copy")
  copy(@CurrentUser() user: AuthUser, @Param("quizId", ParseUUIDPipe) quizId: string) {
    return this.library.copy(user, quizId);
  }
}
