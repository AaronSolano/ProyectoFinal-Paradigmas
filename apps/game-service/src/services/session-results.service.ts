import { Injectable, NotFoundException } from "@nestjs/common";
import type { LeaderboardEntry, PodiumEntry } from "@profelink/shared-dtos";
import { GameSessionRepository } from "../persistence/game-session.repository";

const NOT_FOUND = "Sesión no encontrada.";

export type StoredParticipant = {
  userId: string;
  displayName: string;
  finalScore: number;
};

export type StoredFinishedSession = {
  roomCode: string;
  hostId?: string;
  finishedAt: Date;
  participants: StoredParticipant[];
};

export type SessionResultsSummary = {
  roomCode: string;
  finishedAt: string;
  participants: LeaderboardEntry[];
};

export type SessionResultsDetail = SessionResultsSummary & {
  podium: PodiumEntry[];
};

@Injectable()
export class SessionResultsService {
  constructor(private readonly sessions: GameSessionRepository) {}

  async listForUser(userId: string): Promise<SessionResultsSummary[]> {
    const rows = await this.sessions.listFinishedForUser(userId);
    return rows.map((row) => this.toSummary(row));
  }

  async getForUser(userId: string, roomCode: string): Promise<SessionResultsDetail> {
    const row = await this.sessions.findFinishedForUser(roomCode, userId);
    if (!row) {
      throw new NotFoundException(NOT_FOUND);
    }
    const summary = this.toSummary(row);
    return {
      ...summary,
      podium: this.toPodium(summary.participants),
    };
  }

  private toSummary(row: StoredFinishedSession): SessionResultsSummary {
    return {
      roomCode: row.roomCode,
      finishedAt: row.finishedAt.toISOString(),
      participants: this.rankParticipants(row.participants, row.hostId),
    };
  }

  private rankParticipants(
    participants: StoredParticipant[],
    hostId?: string,
  ): LeaderboardEntry[] {
    const sorted = participants
      .filter((participant) => participant.userId !== hostId)
      .sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    return sorted.map((participant, index) => ({
      userId: participant.userId,
      displayName: participant.displayName,
      score: participant.finalScore,
      rank: index + 1,
    }));
  }

  private toPodium(leaderboard: LeaderboardEntry[]): PodiumEntry[] {
    return leaderboard.slice(0, 3).map((entry, index) => ({
      userId: entry.userId,
      displayName: entry.displayName,
      score: entry.score,
      position: (index + 1) as PodiumEntry["position"],
    }));
  }
}
