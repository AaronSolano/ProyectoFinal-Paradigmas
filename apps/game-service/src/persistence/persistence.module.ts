import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { GameSessionRepository } from "./game-session.repository";
import { QuizRepository } from "./quiz.repository";

@Global()
@Module({
  providers: [PrismaService, QuizRepository, GameSessionRepository],
  exports: [PrismaService, QuizRepository, GameSessionRepository],
})
export class PersistenceModule {}
