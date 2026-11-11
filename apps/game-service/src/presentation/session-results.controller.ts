import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../entities/auth-user";
import { SessionResultsService } from "../services/session-results.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("sessions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("sessions")
export class SessionResultsController {
  constructor(private readonly results: SessionResultsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.results.listForUser(user.userId);
  }

  @Get(":roomCode")
  detail(@CurrentUser() user: AuthUser, @Param("roomCode") roomCode: string) {
    return this.results.getForUser(user.userId, roomCode);
  }
}
