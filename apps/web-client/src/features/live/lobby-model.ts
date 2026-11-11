import { SessionStatus, UserRole, type ParticipantSummary } from "@profelink/shared-dtos";
import { visibleIdentity } from "../../shared/arena-frame";
import { studentRoomPath } from "../../shared/paths";

export function canCreateRoom(questionCount: number): boolean {
  return questionCount > 0;
}

export function inviteUrl(origin: string, roomCode: string): string {
  return `${origin.replace(/\/$/, "")}${studentRoomPath(roomCode)}`;
}

export function joinDisplayName(displayName: string | undefined, role: UserRole): string {
  return visibleIdentity(displayName) ?? (role === UserRole.HOST ? "Profesor" : "Participante");
}

export function visibleParticipantName(participant: ParticipantSummary): string {
  return joinDisplayName(participant.displayName, participant.role);
}

export function playerCount(participants: readonly ParticipantSummary[]): number {
  return participants.filter((participant) => participant.role !== UserRole.HOST).length;
}

export function normalizeRoomCode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function waitingMessage(status: SessionStatus): string {
  if (status === SessionStatus.FINISHED) {
    return "Esta sala ya finalizó.";
  }
  if (status === SessionStatus.QUESTION_CLOSED) {
    return "La pregunta cerró. Esperando la siguiente.";
  }
  if (status === SessionStatus.QUESTION_ACTIVE) {
    return "El profesor abrió una pregunta.";
  }
  return "Esperando a que el profesor inicie el reto.";
}
