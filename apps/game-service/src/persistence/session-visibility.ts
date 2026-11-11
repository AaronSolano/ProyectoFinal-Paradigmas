import { Prisma } from "@profelink/game-prisma";
import { SessionStatus } from "@profelink/shared-dtos";

/**
 * Sesiones finalizadas y persistidas visibles solo para el anfitrión o un participante.
 * Una fila ajena o no finalizada no entra en este filtro.
 */
export function finishedSessionsVisibleTo(userId: string): Prisma.GameSessionWhereInput {
  return {
    status: SessionStatus.FINISHED,
    OR: [{ hostId: userId }, { participants: { some: { userId } } }],
  };
}
