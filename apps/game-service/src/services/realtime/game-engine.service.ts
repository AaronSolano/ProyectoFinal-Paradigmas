import { Injectable } from "@nestjs/common";
import type { GameAnswerAckPayload } from "@profelink/shared-dtos";
import { LiveRoom } from "../../entities/live-room.types";

export type SubmitAnswerResult = {
  ack: GameAnswerAckPayload;
  pointsAwarded: number;
};

@Injectable()
export class GameEngineService {
  submitAnswer(
    room: LiveRoom,
    userId: string,
    answer: boolean,
    now = Date.now(),
  ): SubmitAnswerResult {
    if (room.currentQuestionIndex === null || room.questionExpiresAt === null) {
      return {
        ack: { accepted: false, reason: "no_active_question" },
        pointsAwarded: 0,
      };
    }

    if (now > room.questionExpiresAt) {
      return {
        ack: { accepted: false, reason: "expired" },
        pointsAwarded: 0,
      };
    }

    const alreadyRecorded = room.answersByQuestion
      .get(room.currentQuestionIndex)
      ?.has(userId);
    if (room.answeredUserIds.has(userId) || alreadyRecorded) {
      return {
        ack: { accepted: false, reason: "duplicate" },
        pointsAwarded: 0,
      };
    }

    const question = room.questions[room.currentQuestionIndex];
    if (!question) {
      return {
        ack: { accepted: false, reason: "no_active_question" },
        pointsAwarded: 0,
      };
    }

    room.answeredUserIds.add(userId);

    const isCorrect = answer === question.correctAnswer;
    const pointsAwarded = isCorrect ? 1 : 0;

    const participant = room.participants.get(userId);
    if (participant) {
      participant.score += pointsAwarded;
    }

    let perQuestion = room.answersByQuestion.get(room.currentQuestionIndex);
    if (!perQuestion) {
      perQuestion = new Map();
      room.answersByQuestion.set(room.currentQuestionIndex, perQuestion);
    }
    perQuestion.set(userId, { answer, points: pointsAwarded });

    return {
      ack: { accepted: true },
      pointsAwarded,
    };
  }
}
