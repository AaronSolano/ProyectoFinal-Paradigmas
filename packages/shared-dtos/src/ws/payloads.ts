import type { SessionStatus } from "../enums/session-status";
import type { UserRole } from "../enums/user-role";

export interface ParticipantSummary {
  userId: string;
  displayName: string;
  role: UserRole;
  score: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
}

export interface QuestionOpenedPublic {
  questionId: string;
  questionIndex: number;
  statement: string;
  imageUrl?: string | null;
  timeLimitSeconds: number;
  expiresAt: number;
}

export interface QuestionResultsPayload {
  questionId: string;
  questionIndex: number;
  correctAnswer: boolean;
  trueCount: number;
  falseCount: number;
  leaderboard: LeaderboardEntry[];
}

export interface PodiumEntry {
  userId: string;
  displayName: string;
  score: number;
  position: 1 | 2 | 3;
}

/** Cliente → servidor: unirse a sala con PIN */
export interface RoomJoinPayload {
  roomCode: string;
  displayName?: string;
}

/** Servidor → cliente: lista actualizada de participantes */
export interface RoomParticipantJoinedPayload {
  roomCode: string;
  participants: ParticipantSummary[];
}

/** Servidor → cliente (reconexión): estado sincronizado de la sala */
export interface RoomStateSyncPayload {
  roomCode: string;
  sessionStatus: SessionStatus;
  participants: ParticipantSummary[];
  currentQuestion?: QuestionOpenedPublic | null;
  myScore: number;
  hasAnsweredCurrentQuestion: boolean;
}

/** Anfitrión → servidor: abrir ronda */
export interface GameStartQuestionPayload {
  questionIndex: number;
}

/** Servidor → clientes: pregunta activa (sin correctAnswer) */
export interface GameQuestionOpenedPayload extends QuestionOpenedPublic {
  roomCode: string;
}

/** Participante → servidor: respuesta V/F */
export interface GameSubmitAnswerPayload {
  answer: boolean;
}

/** Servidor → participante: acuse de respuesta */
export interface GameAnswerAckPayload {
  accepted: boolean;
  reason?: "duplicate" | "expired" | "no_active_question" | "unauthorized";
}

/** Anfitrión → servidor: cerrar ronda manualmente */
export interface GameCloseQuestionPayload {
  questionIndex: number;
}

/** Servidor → clientes: resultados de la ronda */
export interface GameQuestionResultsPayload extends QuestionResultsPayload {
  roomCode: string;
}

/** Anfitrión → servidor: finalizar partida */
export interface GameFinishPayload {
  roomCode: string;
}

/** Servidor → clientes: podio final */
export interface GameFinishResultsPayload {
  roomCode: string;
  podium: PodiumEntry[];
  finalLeaderboard: LeaderboardEntry[];
}

/** Mapa evento → payload (tipado para handlers) */
export interface WsEventPayloadMap {
  [key: string]: unknown;
  "room:join": RoomJoinPayload;
  "room:state_sync": RoomStateSyncPayload;
  "room:participant_joined": RoomParticipantJoinedPayload;
  "game:start_question": GameStartQuestionPayload;
  "game:question_opened": GameQuestionOpenedPayload;
  "game:submit_answer": GameSubmitAnswerPayload;
  "game:answer_ack": GameAnswerAckPayload;
  "game:close_question": GameCloseQuestionPayload;
  "game:question_results": GameQuestionResultsPayload;
  "game:finish": GameFinishPayload | GameFinishResultsPayload;
}
