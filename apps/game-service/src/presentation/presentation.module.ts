import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { ServicesModule } from "../services/services.module";
import { WsExceptionFilter } from "./filters/ws-exception.filter";
import { GameGateway } from "./gateway/game.gateway";
import { WsJwtGuard } from "./guards/ws-jwt.guard";
import { ChallengeCopyController } from "./challenge-copy.controller";
import { ChallengePromptController } from "./challenge-prompt.controller";
import { LiveSessionController } from "./live-session.controller";
import { QuizController } from "./quiz.controller";
import { SessionResultsController } from "./session-results.controller";
import { UploadController } from "./upload.controller";
import { JwtAudienceStrategy } from "./strategies/jwt-audience.strategy";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "jwt" }), ServicesModule],
  controllers: [
    QuizController,
    ChallengePromptController,
    ChallengeCopyController,
    UploadController,
    LiveSessionController,
    SessionResultsController,
  ],
  providers: [JwtAudienceStrategy, GameGateway, WsJwtGuard, WsExceptionFilter],
})
export class PresentationModule {}
