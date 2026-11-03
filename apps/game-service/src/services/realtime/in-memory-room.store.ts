import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { SessionStatus } from "@profelink/shared-dtos";
import { LiveRoom, QuestionSnapshot } from "../../entities/live-room.types";
import { formatRoomCode, generateRoomCodeSuffix } from "./room-code.generator";

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class InMemoryRoomStore implements OnModuleDestroy {
  private readonly rooms = new Map<string, LiveRoom>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.evictStaleRooms(), 15 * 60 * 1000);
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    for (const room of this.rooms.values()) {
      if (room.closeTimer) {
        clearTimeout(room.closeTimer);
      }
    }
  }

  createRoom(hostId: string, quizId: string, questions: QuestionSnapshot[]): LiveRoom {
    let roomCode = "";
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = formatRoomCode(generateRoomCodeSuffix());
      if (!this.rooms.has(candidate)) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) {
      throw new Error("No se pudo generar un código de sala único.");
    }

    const room: LiveRoom = {
      roomCode,
      quizId,
      hostId,
      status: SessionStatus.WAITING,
      participants: new Map(),
      questions: [...questions].sort((a, b) => a.sortOrder - b.sortOrder),
      currentQuestionIndex: null,
      questionExpiresAt: null,
      answeredUserIds: new Set(),
      answersByQuestion: new Map(),
      closeTimer: null,
      lastActivityAt: Date.now(),
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): LiveRoom | undefined {
    return this.rooms.get(roomCode);
  }

  deleteRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (room?.closeTimer) {
      clearTimeout(room.closeTimer);
    }
    this.rooms.delete(roomCode);
  }

  touch(room: LiveRoom): void {
    room.lastActivityAt = Date.now();
  }

  private evictStaleRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (
        room.status === SessionStatus.FINISHED &&
        now - room.lastActivityAt > ROOM_TTL_MS
      ) {
        this.deleteRoom(code);
      }
    }
  }
}
