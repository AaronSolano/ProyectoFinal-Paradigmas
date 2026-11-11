import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../entities/auth-user";
import { ChallengeBankService } from "../services/challenge-bank.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { ChallengePromptQueryDto } from "./dto/challenge-prompt-query.dto";
import { HostRoleGuard } from "./guards/host-role.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("challenge-prompts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HostRoleGuard)
@Controller("challenge-prompts")
export class ChallengePromptController {
  constructor(private readonly bank: ChallengeBankService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query() query: ChallengePromptQueryDto) {
    return this.bank.search(user, query);
  }
}
