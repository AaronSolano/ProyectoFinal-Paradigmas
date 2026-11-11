-- CreateEnum
CREATE TYPE "game"."ChallengeCategory" AS ENUM ('cultura-general', 'ciencias', 'tecnologia', 'historia', 'geografia', 'deportes');

-- CreateEnum
CREATE TYPE "game"."ChallengeDifficulty" AS ENUM ('facil', 'intermedia', 'dificil');

-- CreateTable
CREATE TABLE "game"."challenge_prompts" (
    "id" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "correct_answer" BOOLEAN NOT NULL,
    "category" "game"."ChallengeCategory" NOT NULL,
    "difficulty" "game"."ChallengeDifficulty" NOT NULL,
    "suggested_time_limit_seconds" INTEGER NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_prompts_statement_key" ON "game"."challenge_prompts"("statement");

-- CreateIndex
CREATE INDEX "challenge_prompts_category_difficulty_idx" ON "game"."challenge_prompts"("category", "difficulty");
