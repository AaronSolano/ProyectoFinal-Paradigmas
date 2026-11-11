## 1. Web Client Scaffolding & Shared Setup

- [x] 1.1 Scaffold React 18 + Vite + Tailwind CSS 3 in `apps/web-client` as package `@profelink/web-client`, with the visible VeriX identity and no ProfeLink commercial naming.
- [x] 1.2 Configure API and WebSocket environment variables (`VITE_AUTH_API_URL`, `VITE_GAME_API_URL`, `VITE_GAME_WS_URL`) and a shared fetch client that attaches the Bearer token.
- [x] 1.3 Setup authentication state, session token storage, and role gates for `HOST` and `PARTICIPANT`.
- [x] 1.4 Create the feature folders `auth`, `quizzes`, `live`, and `results`, plus the route map, without adding the question-bank feature.

## 2. Host / Teacher Experience

- [x] 2.1 Implement the teacher panel and manual quiz screens: list, create, edit, and delete quizzes and true/false questions.
- [x] 2.2 Add optional question images through `POST /api/upload` and the existing question update contract.
- [x] 2.3 Implement room creation and the waiting room with the returned `PL-XXXX` code, a client-generated join QR, and the live participant list. The host start control stays disabled until question control is implemented.
- [x] 2.4 Implement the host stage: open question, countdown from `expiresAt`, hidden correct answer, close question, and answer count.
- [x] 2.5 Finish only after the last question is closed: confirm, emit `game:finish` once, and keep the server `finalLeaderboard`.
- [x] 2.7 Show the visual podium and the full server ranking after `game:finish`, keep them if the socket drops, and return to the teacher panel without emitting `game:finish` again.
- [x] 2.6 Implement the host historical-results list and detail using `GET /api/sessions` and `GET /api/sessions/{roomCode}`.

## 3. Student / Participant Experience

- [x] 3.1 Implement the join screen with room code and display name.
- [x] 3.2 Implement the synchronized waiting view. Question controls remain for a later stage.
- [x] 3.3 Implement the true/false screen with large controls, one submission, and disabled input after `game:answer_ack`.
- [x] 3.4 Show round feedback, current score, and ranking after `game:question_results`. After `game:finish`, show the same visual podium, the server rank and score, and a return to the student start.
- [x] 3.5 Restore the active question from `room:state_sync` after a socket reconnection and keep an already answered question locked.
- [x] 3.6 Implement the participant historical-results view with the same session endpoints and the same 404 presentation.

## 4. External Consumer Application

- [x] 4.1 Scaffold `apps/external-consumer` with independent build setup running on port 5174.
- [x] 4.2 Implement login flow querying `auth-service` and receiving token with `aud: "profelink-game-api"`.
- [x] 4.3 Implement session result query screen calling `game-service` REST API.
- [x] 4.4 Cover login, session list, room lookup, 401, 403, 404, connection failure, and logout with isolated Vitest mocks. A Jest end-to-end test against PostgreSQL stays out of this stage.

## 5. Dockerization & Compose Integration

- [x] 5.1 Create Nginx-based `Dockerfile` for `apps/web-client` (port 5173).
- [x] 5.2 Create Nginx-based `Dockerfile` for `apps/external-consumer` (port 5174).
- [x] 5.3 Integrate both frontends into `docker-compose.yml`.

## 6. Backend HTTP access for browser clients

- [x] 6.1 Configure and verify CORS on `auth-service` and `game-service` for `http://localhost:5173` and `http://localhost:5174`, including successful HTTP responses and `OPTIONS` preflight.
- [x] 6.2 Add and verify the authenticated REST read of persisted finished sessions (`GET /api/sessions` and `GET /api/sessions/{roomCode}`) required by the external consumer.

## 7. VeriX verification and later question bank

- [x] 7.1 Add Vitest coverage for the live-state reducer, role gates, and true/false submission lock.
- [x] 7.2 Keep the persistent challenge bank out of this change; it is planned in `reusable-challenge-bank`.
- [x] 7.3 Keep AI question generation out of the implementation.

## 8. Question time bounds

- [x] 8.1 Reject question times outside 5–120 seconds in the editor and on the question DTOs, without changing Prisma or the challenge bank.
