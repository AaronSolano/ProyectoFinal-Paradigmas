import { UserRole, type ParticipantSummary } from "@profelink/shared-dtos";
import { SessionStatus } from "@profelink/shared-dtos";
import {
  canCreateRoom,
  inviteUrl,
  joinDisplayName,
  normalizeRoomCode,
  playerCount,
  visibleParticipantName,
  waitingMessage,
} from "./lobby-model";

describe("lobby de partida", () => {
  it("impide crear una sala sin preguntas", () => {
    expect(canCreateRoom(0)).toBe(false);
    expect(canCreateRoom(2)).toBe(true);
  });

  it("arma el enlace real de invitación", () => {
    expect(inviteUrl("http://localhost:5173/", "PL-AB12")).toBe(
      "http://localhost:5173/estudiante/sala/PL-AB12",
    );
  });

  it("no usa un nombre de demostración que contiene ProfeLink", () => {
    expect(joinDisplayName("Profesor ProfeLink", UserRole.HOST)).toBe("Profesor");
    expect(joinDisplayName("Ana Demo", UserRole.PARTICIPANT)).toBe("Ana Demo");
  });

  it("cuenta jugadores sin incluir al profesor", () => {
    const participants: ParticipantSummary[] = [
      { userId: "host", displayName: "Profesor ProfeLink", role: UserRole.HOST, score: 0 },
      { userId: "student", displayName: "Ana Demo", role: UserRole.PARTICIPANT, score: 0 },
    ];

    expect(playerCount(participants)).toBe(1);
    expect(visibleParticipantName(participants[0])).toBe("Profesor");
    expect(visibleParticipantName(participants[1])).toBe("Ana Demo");
  });

  it("normaliza el código y describe la espera solo con el estado del servidor", () => {
    expect(normalizeRoomCode("  pl-ab12 ")).toBe("PL-AB12");
    expect(waitingMessage(SessionStatus.WAITING)).toBe("Esperando a que el profesor inicie el reto.");
    expect(waitingMessage(SessionStatus.QUESTION_ACTIVE)).toBe("El profesor abrió una pregunta.");
    expect(waitingMessage(SessionStatus.QUESTION_CLOSED)).toBe("La pregunta cerró. Esperando la siguiente.");
    expect(waitingMessage(SessionStatus.FINISHED)).toBe("Esta sala ya finalizó.");
  });
});
