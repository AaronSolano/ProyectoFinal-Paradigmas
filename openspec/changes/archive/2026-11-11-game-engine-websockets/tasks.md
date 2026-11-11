## 1. Gateway & Handshake Authentication

- [x] 1.1 Implement `WsJwtGuard` validating JWT token in Socket.io connection handshake (`auth.token`).
- [x] 1.2 Implement `GameGateway` handling client connections, disconnections, and error filters.

## 2. In-Memory Room & State Store

- [x] 2.1 Implement `InMemoryRoomStore` managing room codes, participant maps, and question state.
- [x] 2.2 Implement 6-character unique room code generator (`PL-XXXX`).

## 3. Realtime Events & Host Workflow

- [x] 3.1 Implement `room:join` and broadcast `room:participant_joined` with active participant list.
- [x] 3.2 Implement `game:start_question` broadcasting `game:question_opened` with `correctAnswer` stripped.
- [x] 3.3 Implement `game:close_question` calculating results and broadcasting `game:question_results`.
- [x] 3.4 Implement `game:finish` calculating final podium and writing results to PostgreSQL.

## 4. Business Logic: Scoring & Anti-Double Voting

- [x] 4.1 Implement `GameEngineService.submitAnswer` with `Set<userId>` anti-double voting check.
- [x] 4.2 Enforce server-side expiration validation (`now <= expiresAt`).
- [x] 4.3 Implement scoring accumulator (1 point for correct on-time answer, 0 otherwise).

## 5. Reconnection & Automated Tests

- [x] 5.1 Implement participant reconnection logic emitting `room:state_sync` with current question, remaining seconds, and score.
- [x] 5.2 Write unit tests for scoring rules and anti-double voting in Jest (`answer-validation.spec.ts`).
- [x] 5.3 Write integration tests for concurrent room isolation (`concurrent-rooms.e2e-spec.ts`).
- [x] 5.4 Write integration tests for reconnection flow (`reconnection.spec.ts`).

## 6. Scoring integrity before live questions

- [x] 6.1 Reject reopening a used `questionIndex` so a participant cannot score twice on the same question.
- [x] 6.2 Exclude the host from the live and historical leaderboard and podium, while keeping the host in the participant list.
- [x] 6.3 Do not add a participant cap. A 200-student load test remains deferred and must use an isolated database.
- [x] 6.4 Finish only after every question is closed, persist before `game:finish`, and reject a repeated or premature finish without a second write.
