import { Injectable } from "@nestjs/common";
import { SessionStatus } from "@profelink/shared-dtos";
import { LiveRoom } from "../entities/live-room.types";
import { PrismaService } from "./prisma.service";

@Injectable()
export class GameSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async persistFinishedSession(room: LiveRoom): Promise<void> {
    const finishedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.create({
        data: {
          roomCode: room.roomCode,
          quizId: room.quizId,
          hostId: room.hostId,
          status: SessionStatus.FINISHED,
          finishedAt,
        },
      });

      for (const participant of room.participants.values()) {
        const row = await tx.sessionParticipant.create({
          data: {
            sessionId: session.id,
            userId: participant.userId,
            displayName: participant.displayName,
            finalScore: participant.score,
          },
        });

        for (const [questionIndex, answers] of room.answersByQuestion.entries()) {
          const entry = answers.get(participant.userId);
          if (!entry) {
            continue;
          }
          const question = room.questions[questionIndex];
          if (!question) {
            continue;
          }
          const isCorrect = entry.answer === question.correctAnswer;
          await tx.participantAnswer.create({
            data: {
              participantId: row.id,
              questionId: question.id,
              questionIndex,
              answer: entry.answer,
              isCorrect,
              pointsAwarded: entry.points,
            },
          });
        }
      }
    });
  }
}
