/**
 * Nombres canónicos de eventos Socket.io (contrato compartido cliente ↔ game-service).
 */
export const WsEventNames = {
  ROOM_JOIN: "room:join",
  ROOM_STATE_SYNC: "room:state_sync",
  ROOM_PARTICIPANT_JOINED: "room:participant_joined",
  GAME_START_QUESTION: "game:start_question",
  GAME_QUESTION_OPENED: "game:question_opened",
  GAME_SUBMIT_ANSWER: "game:submit_answer",
  GAME_ANSWER_ACK: "game:answer_ack",
  GAME_CLOSE_QUESTION: "game:close_question",
  GAME_QUESTION_RESULTS: "game:question_results",
  GAME_FINISH: "game:finish",
} as const;

export type WsEventName = (typeof WsEventNames)[keyof typeof WsEventNames];
