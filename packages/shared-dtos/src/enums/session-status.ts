/** Ciclo de vida de una sala / sesión en vivo */
export enum SessionStatus {
  WAITING = "WAITING",
  QUESTION_ACTIVE = "QUESTION_ACTIVE",
  QUESTION_CLOSED = "QUESTION_CLOSED",
  FINISHED = "FINISHED",
}
