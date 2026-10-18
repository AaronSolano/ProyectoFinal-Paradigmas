## 1. Web Client Scaffolding & Shared Setup

- [ ] 1.1 Scaffold React 18 + Vite + Tailwind CSS in `apps/web-client`.
- [ ] 1.2 Configure API and WebSocket environment variables (`VITE_AUTH_API_URL`, `VITE_GAME_API_URL`, `VITE_GAME_WS_URL`).
- [ ] 1.3 Setup authentication state context (`AuthContext`) and HTTP client with Bearer token interceptor.

## 2. Host / Teacher Experience

- [ ] 2.1 Implement Quiz Management screens (list, create, edit question, image upload).
- [ ] 2.2 Implement Room Creation and Lobby view displaying 6-char PIN and real-time player list.
- [ ] 2.3 Implement Projector view displaying active question, support image, countdown timer, and answer counter.
- [ ] 2.4 Implement Question Results view and Final Podium screen.

## 3. Student / Participant Experience

- [ ] 3.1 Implement Join Room screen with room PIN and nickname input.
- [ ] 3.2 Implement Waiting / Synchronized Lobby view.
- [ ] 3.3 Implement True/False Game screen with high-contrast binary action buttons and instant feedback.
- [ ] 3.4 Implement reconnection handling restoring current question state and score.

## 4. External Consumer Application

- [ ] 4.1 Scaffold `apps/external-consumer` with independent build setup running on port 5174.
- [ ] 4.2 Implement login flow querying `auth-service` and receiving token with `aud: "profelink-game-api"`.
- [ ] 4.3 Implement session result query screen calling `game-service` REST API.
- [ ] 4.4 Write automated integration test in Jest (`external-consumer.e2e-spec.ts`).

## 5. Dockerization & Compose Integration

- [ ] 5.1 Create Nginx-based `Dockerfile` for `apps/web-client` (port 5173).
- [ ] 5.2 Create Nginx-based `Dockerfile` for `apps/external-consumer` (port 5174).
- [ ] 5.3 Integrate both frontends into `docker-compose.yml`.
