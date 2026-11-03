import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../entities/auth-user";
import { RoomManagerService } from "../services/realtime/room-manager.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("live-sessions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("quizzes/:quizId/sessions")
export class LiveSessionController {
  constructor(private readonly rooms: RoomManagerService) {}

  @Post()
  createSession(@CurrentUser() user: AuthUser, @Param("quizId") quizId: string) {
    return this.rooms.createLiveSession(user, quizId);
  }
}
