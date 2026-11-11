import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../entities/auth-user";
import { ChallengeBankService } from "../services/challenge-bank.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { CopyChallengePromptsDto } from "./dto/copy-challenge-prompts.dto";
import { HostRoleGuard } from "./guards/host-role.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("quizzes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HostRoleGuard)
@Controller("quizzes")
export class ChallengeCopyController {
  constructor(private readonly bank: ChallengeBankService) {}

  @Post(":quizId/questions/from-bank")
  copy(
    @CurrentUser() user: AuthUser,
    @Param("quizId") quizId: string,
    @Body() dto: CopyChallengePromptsDto,
  ) {
    return this.bank.copyIntoQuiz(user, quizId, dto);
  }
}
