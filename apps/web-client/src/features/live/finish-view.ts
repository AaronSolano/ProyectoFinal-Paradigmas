import type { GameFinishResultsPayload, LeaderboardEntry, PodiumEntry } from "@profelink/shared-dtos";

const PODIUM_ORDER = [2, 1, 3] as const;

export function podiumSlots(podium: readonly PodiumEntry[]): PodiumEntry[] {
  const byPosition = new Map(podium.map((entry) => [entry.position, entry]));
  return PODIUM_ORDER.flatMap((position) => {
    const entry = byPosition.get(position);
    return entry ? [entry] : [];
  });
}

export function finalRanking(entries: readonly LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.map((entry) => ({ ...entry }));
}

export function finishView(payload: GameFinishResultsPayload): {
  podium: PodiumEntry[];
  ranking: LeaderboardEntry[];
  empty: boolean;
} {
  const podium = podiumSlots(payload.podium);
  const ranking = finalRanking(payload.finalLeaderboard);
  return {
    podium,
    ranking,
    empty: podium.length === 0 && ranking.length === 0,
  };
}

export function retainFinishedResult<T>(result: T | null): T | null {
  return result;
}

export function blocksLiveUpdates(finished: boolean): boolean {
  return finished;
}
