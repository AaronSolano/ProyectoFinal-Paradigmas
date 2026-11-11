import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type {
  GameFinishResultsPayload,
  GameQuestionOpenedPayload,
  GameQuestionResultsPayload,
  LeaderboardEntry,
  ParticipantSummary,
  PodiumEntry,
  QuestionOpenedPublic,
  RoomStateSyncPayload,
} from "@profelink/shared-dtos";
import { SessionStatus, WsEventNames } from "@profelink/shared-dtos";
import { AuthUser } from "../../entities/auth-user";
import { LiveParticipant, LiveRoom } from "../../entities/live-room.types";
import { GameSessionRepository } from "../../persistence/game-session.repository";
import { QuizRepository } from "../../persistence/quiz.repository";
import { GameEngineService } from "./game-engine.service";
import { assertHost } from "../host-access";
import { InMemoryRoomStore } from "./in-memory-room.store";

export type RoomEventEmitter = {
  toRoom: (roomCode: string, event: string, payload: unknown) => void;
  toClient: (socketId: string, event: string, payload: unknown) => void;
};

@Injectable()
export class RoomManagerService {
  constructor(
    private readonly store: InMemoryRoomStore,
    private readonly engine: GameEngineService,
    private readonly quizzes: QuizRepository,
    private readonly sessions: GameSessionRepository,
  ) {}

  async createLiveSession(host: AuthUser, quizId: string): Promise<{ roomCode: string }> {
    assertHost(host);
    const quiz = await this.quizzes.findQuizById(quizId);
    if (!quiz) {
      throw new NotFoundException("Cuestionario no encontrado.");
    }
    if (quiz.ownerId !== host.userId) {
      throw new ForbiddenException("Solo el anfitrión del cuestionario puede iniciar una sala.");
    }

    const questions = await this.quizzes.listQuestionsByQuiz(quizId);
    if (questions.length === 0) {
      throw new BadRequestException("El cuestionario no tiene preguntas.");
    }

    const room = this.store.createRoom(
      host.userId,
      quizId,
      questions.map((q) => ({
        id: q.id,
        statement: q.statement,
        imageUrl: q.imageUrl,
        correctAnswer: q.correctAnswer,
        timeLimitSeconds: q.timeLimitSeconds,
        sortOrder: q.sortOrder,
      })),
    );

    return { roomCode: room.roomCode };
  }

  joinRoom(
    user: AuthUser,
    roomCode: string,
    displayName: string | undefined,
    socketId: string,
    emit: RoomEventEmitter,
  ): LiveRoom {
    const room = this.requireRoom(roomCode);
    this.store.touch(room);

    const name =
      displayName?.trim() ||
      user.email.split("@")[0] ||
      "Participante";

    const existing = room.participants.get(user.userId);
    const participant: LiveParticipant = {
      userId: user.userId,
      displayName: existing?.displayName ?? name,
      role: user.userId === room.hostId ? "HOST" : user.role,
      score: existing?.score ?? 0,
      socketId,
    };
    room.participants.set(user.userId, participant);

    emit.toRoom(roomCode, WsEventNames.ROOM_PARTICIPANT_JOINED, {
      roomCode,
      participants: this.participantSummaries(room),
    });

    const sync: RoomStateSyncPayload = this.buildStateSync(room, user.userId);
    emit.toClient(socketId, WsEventNames.ROOM_STATE_SYNC, sync);

    return room;
  }

  startQuestion(
    host: AuthUser,
    roomCode: string,
    questionIndex: number,
    emit: RoomEventEmitter,
    onAutoClose: (roomCode: string, questionIndex: number) => void,
  ): GameQuestionOpenedPayload {
    const room = this.requireRoom(roomCode);
    this.assertHost(host, room);
    this.store.touch(room);

    if (room.status === SessionStatus.FINISHED) {
      throw new BadRequestException("La partida ya finalizó.");
    }

    const question = room.questions[questionIndex];
    if (!question) {
      throw new BadRequestException("Índice de pregunta inválido.");
    }

    if (room.openedQuestionIndexes.has(questionIndex)) {
      throw new BadRequestException("Esta pregunta ya fue abierta.");
    }

    if (room.closeTimer) {
      clearTimeout(room.closeTimer);
      room.closeTimer = null;
    }

    room.openedQuestionIndexes.add(questionIndex);
    room.currentQuestionIndex = questionIndex;
    room.status = SessionStatus.QUESTION_ACTIVE;
    room.answeredUserIds = new Set();
    room.questionExpiresAt = Date.now() + question.timeLimitSeconds * 1000;

    room.closeTimer = setTimeout(() => {
      onAutoClose(roomCode, questionIndex);
    }, question.timeLimitSeconds * 1000);

    const payload: GameQuestionOpenedPayload = {
      roomCode,
      questionId: question.id,
      questionIndex,
      statement: question.statement,
      imageUrl: question.imageUrl,
      timeLimitSeconds: question.timeLimitSeconds,
      expiresAt: room.questionExpiresAt,
    };

    emit.toRoom(roomCode, WsEventNames.GAME_QUESTION_OPENED, payload);
    return payload;
  }

  closeQuestion(
    host: AuthUser | null,
    roomCode: string,
    questionIndex: number,
    emit: RoomEventEmitter,
  ): GameQuestionResultsPayload {
    const room = this.requireRoom(roomCode);
    if (host) {
      this.assertHost(host, room);
    }
    this.store.touch(room);

    if (room.currentQuestionIndex !== questionIndex) {
      throw new BadRequestException("No hay una pregunta activa con ese índice.");
    }

    if (room.closeTimer) {
      clearTimeout(room.closeTimer);
      room.closeTimer = null;
    }

    const question = room.questions[questionIndex];
    const answers = room.answersByQuestion.get(questionIndex) ?? new Map();
    let trueCount = 0;
    let falseCount = 0;
    for (const { answer } of answers.values()) {
      if (answer) {
        trueCount += 1;
      } else {
        falseCount += 1;
      }
    }

    room.status = SessionStatus.QUESTION_CLOSED;
    room.questionExpiresAt = null;

    const payload: GameQuestionResultsPayload = {
      roomCode,
      questionId: question.id,
      questionIndex,
      correctAnswer: question.correctAnswer,
      trueCount,
      falseCount,
      leaderboard: this.leaderboard(room),
    };

    emit.toRoom(roomCode, WsEventNames.GAME_QUESTION_RESULTS, payload);
    return payload;
  }

  submitAnswer(
    user: AuthUser,
    roomCode: string,
    answer: boolean,
    emit: RoomEventEmitter,
    socketId: string,
  ) {
    const room = this.requireRoom(roomCode);
    this.store.touch(room);

    if (user.userId === room.hostId) {
      emit.toClient(socketId, WsEventNames.GAME_ANSWER_ACK, {
        accepted: false,
        reason: "unauthorized",
      });
      return;
    }

    const result = this.engine.submitAnswer(room, user.userId, answer);
    emit.toClient(socketId, WsEventNames.GAME_ANSWER_ACK, result.ack);
  }

  async finishGame(
    host: AuthUser,
    roomCode: string,
    emit: RoomEventEmitter,
  ): Promise<GameFinishResultsPayload> {
    const room = this.requireRoom(roomCode);
    this.assertHost(host, room);
    this.store.touch(room);

    this.assertReadyToFinish(room);

    if (room.closeTimer) {
      clearTimeout(room.closeTimer);
      room.closeTimer = null;
    }

    room.finishing = true;
    try {
      await this.sessions.persistFinishedSession(room);
    } catch {
      room.finishing = false;
      throw new InternalServerErrorException(
        "No se pudo guardar el resultado. La partida sigue abierta.",
      );
    }

    room.status = SessionStatus.FINISHED;

    const leaderboard = this.leaderboard(room);
    const podium = this.buildPodium(leaderboard);

    const payload: GameFinishResultsPayload = {
      roomCode,
      podium,
      finalLeaderboard: leaderboard,
    };

    emit.toRoom(roomCode, WsEventNames.GAME_FINISH, payload);
    this.store.deleteRoom(roomCode);

    return payload;
  }

  private assertReadyToFinish(room: LiveRoom): void {
    if (room.finishing || room.status === SessionStatus.FINISHED) {
      throw new BadRequestException("La partida ya finalizó.");
    }
    if (room.status === SessionStatus.QUESTION_ACTIVE) {
      throw new BadRequestException("Hay una pregunta abierta.");
    }
    const allOpened = room.questions.every((_, index) => room.openedQuestionIndexes.has(index));
    if (!allOpened || room.status !== SessionStatus.QUESTION_CLOSED) {
      throw new BadRequestException("Aún hay preguntas pendientes.");
    }
  }

  buildStateSync(room: LiveRoom, userId: string): RoomStateSyncPayload {
    let currentQuestion: QuestionOpenedPublic | null | undefined;
    if (
      room.currentQuestionIndex !== null &&
      room.status === SessionStatus.QUESTION_ACTIVE
    ) {
      const q = room.questions[room.currentQuestionIndex];
      currentQuestion = {
        questionId: q.id,
        questionIndex: room.currentQuestionIndex,
        statement: q.statement,
        imageUrl: q.imageUrl,
        timeLimitSeconds: q.timeLimitSeconds,
        expiresAt: room.questionExpiresAt ?? Date.now(),
      };
    } else {
      currentQuestion = null;
    }

    const participant = room.participants.get(userId);

    return {
      roomCode: room.roomCode,
      sessionStatus: room.status,
      participants: this.participantSummaries(room),
      currentQuestion,
      myScore: participant?.score ?? 0,
      hasAnsweredCurrentQuestion: room.answeredUserIds.has(userId),
    };
  }

  private requireRoom(roomCode: string): LiveRoom {
    const room = this.store.getRoom(roomCode);
    if (!room) {
      throw new NotFoundException("Sala no encontrada.");
    }
    return room;
  }

  private assertHost(user: AuthUser, room: LiveRoom): void {
    if (user.userId !== room.hostId) {
      throw new ForbiddenException("Solo el anfitrión puede ejecutar esta acción.");
    }
  }

  private participantSummaries(room: LiveRoom): ParticipantSummary[] {
    return [...room.participants.values()].map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      role: p.role as ParticipantSummary["role"],
      score: p.score,
    }));
  }

  private leaderboard(room: LiveRoom): LeaderboardEntry[] {
    const sorted = [...room.participants.values()]
      .filter((participant) => participant.userId !== room.hostId)
      .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    return sorted.map((p, index) => ({
      userId: p.userId,
      displayName: p.displayName,
      score: p.score,
      rank: index + 1,
    }));
  }

  private buildPodium(leaderboard: LeaderboardEntry[]): PodiumEntry[] {
    const top = leaderboard.slice(0, 3);
    return top.map((entry, idx) => ({
      userId: entry.userId,
      displayName: entry.displayName,
      score: entry.score,
      position: (idx + 1) as PodiumEntry["position"],
    }));
  }
}
