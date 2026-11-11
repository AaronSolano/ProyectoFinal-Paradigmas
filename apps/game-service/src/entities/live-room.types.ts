import { SessionStatus } from "@profelink/shared-dtos";

export type QuestionSnapshot = {
  id: string;
  statement: string;
  imageUrl: string | null;
  correctAnswer: boolean;
  timeLimitSeconds: number;
  sortOrder: number;
};

export type LiveParticipant = {
  userId: string;
  displayName: string;
  role: string;
  score: number;
  socketId?: string;
};

export type LiveRoom = {
  roomCode: string;
  quizId: string;
  hostId: string;
  status: SessionStatus;
  participants: Map<string, LiveParticipant>;
  questions: QuestionSnapshot[];
  currentQuestionIndex: number | null;
  questionExpiresAt: number | null;
  answeredUserIds: Set<string>;
  openedQuestionIndexes: Set<number>;
  answersByQuestion: Map<number, Map<string, { answer: boolean; points: number }>>;
  closeTimer: ReturnType<typeof setTimeout> | null;
  finishing: boolean;
  lastActivityAt: number;
};
