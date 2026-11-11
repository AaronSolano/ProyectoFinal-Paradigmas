-- CreateTable
CREATE TABLE "game"."game_sessions" (
    "id" UUID NOT NULL,
    "room_code" TEXT NOT NULL,
    "quiz_id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game"."session_participants" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "final_score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game"."participant_answers" (
    "id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "question_index" INTEGER NOT NULL,
    "answer" BOOLEAN NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "participant_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_room_code_key" ON "game"."game_sessions"("room_code");

-- CreateIndex
CREATE INDEX "game_sessions_quiz_id_idx" ON "game"."game_sessions"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_session_id_user_id_key" ON "game"."session_participants"("session_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_answers_participant_id_question_id_key" ON "game"."participant_answers"("participant_id", "question_id");

-- AddForeignKey
ALTER TABLE "game"."session_participants" ADD CONSTRAINT "session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game"."game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game"."participant_answers" ADD CONSTRAINT "participant_answers_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "game"."session_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
