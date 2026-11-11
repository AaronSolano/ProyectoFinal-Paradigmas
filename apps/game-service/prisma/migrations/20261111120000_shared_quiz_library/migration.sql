-- AlterTable: additive columns for the shared quiz library.
-- Existing quizzes stay private (published = false) and uncategorized (category NULL).
ALTER TABLE "game"."quizzes"
    ADD COLUMN "category" "game"."ChallengeCategory",
    ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "published_at" TIMESTAMP(3),
    ADD COLUMN "source_quiz_id" UUID;

-- CreateIndex
CREATE INDEX "quizzes_published_category_idx" ON "game"."quizzes"("published", "category");

-- CreateIndex
CREATE INDEX "quizzes_source_quiz_id_idx" ON "game"."quizzes"("source_quiz_id");

-- AddForeignKey: deleting the original keeps its copies.
ALTER TABLE "game"."quizzes" ADD CONSTRAINT "quizzes_source_quiz_id_fkey" FOREIGN KEY ("source_quiz_id") REFERENCES "game"."quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
