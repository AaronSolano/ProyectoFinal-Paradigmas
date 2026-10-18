## 1. Gateway & Handshake Authentication

- [ ] 1.1 Implement `WsJwtGuard` validating JWT token in Socket.io connection handshake (`auth.token`).
- [ ] 1.2 Implement `GameGateway` handling client connections, disconnections, and error filters.

## 2. In-Memory Room & State Store

- [ ] 2.1 Implement `InMemoryRoomStore` managing room codes, participant maps, and question state.
- [ ] 2.2 Implement 6-character unique room code generator (`PL-XXXX`).

## 3. Realtime Events & Host Workflow

- [ ] 3.1 Implement `room:join` and broadcast `room:participant_joined` with active participant list.
- [ ] 3.2 Implement `game:start_question` broadcasting `game:question_opened` with `correctAnswer` stripped.
- [ ] 3.3 Implement `game:close_question` calculating results and broadcasting `game:question_results`.
- [ ] 3.4 Implement `game:finish` calculating final podium and writing results to PostgreSQL.

## 4. Business Logic: Scoring & Anti-Double Voting

- [ ] 4.1 Implement `GameEngineService.submitAnswer` with `Set<userId>` anti-double voting check.
- [ ] 4.2 Enforce server-side expiration validation (`now <= expiresAt`).
- [ ] 4.3 Implement scoring accumulator (1 point for correct on-time answer, 0 otherwise).

## 5. Reconnection & Automated Tests

- [ ] 5.1 Implement participant reconnection logic emitting `room:state_sync` with current question, remaining seconds, and score.
- [ ] 5.2 Write unit tests for scoring rules and anti-double voting in Jest (`answer-validation.spec.ts`).
- [ ] 5.3 Write integration tests for concurrent room isolation (`concurrent-rooms.e2e-spec.ts`).
- [ ] 5.4 Write integration tests for reconnection flow (`reconnection.spec.ts`).
