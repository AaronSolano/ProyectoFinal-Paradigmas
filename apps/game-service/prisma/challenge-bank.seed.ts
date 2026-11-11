import { resolve } from "node:path";
import { config } from "dotenv";
import { ChallengeCategory, ChallengeDifficulty, PrismaClient } from "@profelink/game-prisma";
import {
  CHALLENGE_BANK,
  type ChallengeCategoryCode,
  type ChallengeDifficultyCode,
} from "../src/persistence/challenge-bank.catalog";

const CATEGORY: Record<ChallengeCategoryCode, ChallengeCategory> = {
  "cultura-general": ChallengeCategory.cultura_general,
  ciencias: ChallengeCategory.ciencias,
  tecnologia: ChallengeCategory.tecnologia,
  historia: ChallengeCategory.historia,
  geografia: ChallengeCategory.geografia,
  deportes: ChallengeCategory.deportes,
};

const DIFFICULTY: Record<ChallengeDifficultyCode, ChallengeDifficulty> = {
  facil: ChallengeDifficulty.facil,
  intermedia: ChallengeDifficulty.intermedia,
  dificil: ChallengeDifficulty.dificil,
};

config({ path: resolve(__dirname, "../../../.env") });

if (!process.env.DATABASE_URL_GAME) {
  throw new Error("Falta DATABASE_URL_GAME.");
}

const prisma = new PrismaClient();

async function main() {
  for (const item of CHALLENGE_BANK) {
    const data = {
      correctAnswer: item.correctAnswer,
      category: CATEGORY[item.category],
      difficulty: DIFFICULTY[item.difficulty],
      suggestedTimeLimitSeconds: item.suggestedTimeLimitSeconds,
    };
    await prisma.challengePrompt.upsert({
      where: { statement: item.statement },
      create: { statement: item.statement, imageUrl: null, ...data },
      update: data,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    const message = error instanceof Error ? error.message : "El seed del banco falló.";
    console.error(message.replace(/postgresql:\/\/\S+/gi, "[conexión]"));
    process.exitCode = 1;
  });
