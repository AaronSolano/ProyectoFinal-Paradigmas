import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { GameSessionRepository } from "./game-session.repository";
import { ChallengeBankRepository } from "./challenge-bank.repository";
import { QuizRepository } from "./quiz.repository";

@Global()
@Module({
  providers: [PrismaService, QuizRepository, GameSessionRepository, ChallengeBankRepository],
  exports: [PrismaService, QuizRepository, GameSessionRepository, ChallengeBankRepository],
})
export class PersistenceModule {}
