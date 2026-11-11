import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { GameSessionRepository } from "../persistence/game-session.repository";
import { SessionResultsService } from "../services/session-results.service";
import { SessionResultsController } from "./session-results.controller";
import { JwtAudienceStrategy } from "./strategies/jwt-audience.strategy";

const SECRET = "test-secret";
const AUDIENCE = "profelink-game-api";
const ISSUER = "profelink-auth-service";

describe("Session results HTTP", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const sessions = {
    listFinishedForUser: jest.fn(),
    findFinishedForUser: jest.fn(),
  };

  const host = { sub: "host-1", email: "profe@profelink.cr", role: "HOST" };
  const outsider = { sub: "outsider-1", email: "otro@profelink.cr", role: "PARTICIPANT" };

  const finished = {
    roomCode: "PL-AB12",
    hostId: "teacher-1",
    finishedAt: new Date("2026-11-10T18:00:00.000Z"),
    participants: [{ userId: "host-1", displayName: "Ana", finalScore: 1 }],
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    process.env.JWT_AUDIENCE = AUDIENCE;
    process.env.JWT_ISSUER = ISSUER;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({ secret: SECRET }),
      ],
      controllers: [SessionResultsController],
      providers: [
        SessionResultsService,
        JwtAudienceStrategy,
        { provide: GameSessionRepository, useValue: sessions },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  function tokenFor(payload: Record<string, unknown>, audience = AUDIENCE): string {
    return jwt.sign(payload, {
      secret: SECRET,
      audience,
      issuer: ISSUER,
      expiresIn: "1h",
    });
  }

  it("returns 200 with the caller's finished sessions", async () => {
    sessions.listFinishedForUser.mockResolvedValue([finished]);

    const response = await request(app.getHttpServer())
      .get("/api/sessions")
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .expect(200);

    expect(sessions.listFinishedForUser).toHaveBeenCalledWith("host-1");
    expect(response.body).toEqual([
      {
        roomCode: "PL-AB12",
        finishedAt: "2026-11-10T18:00:00.000Z",
        participants: [{ userId: "host-1", displayName: "Ana", score: 1, rank: 1 }],
      },
    ]);
  });

  it("returns 200 and an empty list when the caller has no finished sessions", async () => {
    sessions.listFinishedForUser.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get("/api/sessions")
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("returns 200 with podium for a visible finished session", async () => {
    sessions.findFinishedForUser.mockResolvedValue(finished);

    const response = await request(app.getHttpServer())
      .get("/api/sessions/PL-AB12")
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .expect(200);

    expect(sessions.findFinishedForUser).toHaveBeenCalledWith("PL-AB12", "host-1");
    expect(response.body.podium).toEqual([
      { userId: "host-1", displayName: "Ana", score: 1, position: 1 },
    ]);
  });

  it("returns 401 when the token is missing", async () => {
    await request(app.getHttpServer()).get("/api/sessions").expect(401);
    await request(app.getHttpServer()).get("/api/sessions/PL-AB12").expect(401);
    expect(sessions.listFinishedForUser).not.toHaveBeenCalled();
    expect(sessions.findFinishedForUser).not.toHaveBeenCalled();
  });

  it("returns 401 when the token audience is wrong", async () => {
    await request(app.getHttpServer())
      .get("/api/sessions")
      .set("Authorization", `Bearer ${tokenFor(host, "other-api")}`)
      .expect(401);

    expect(sessions.listFinishedForUser).not.toHaveBeenCalled();
  });

  it("returns the same 404 for a missing session and for a session the caller cannot see", async () => {
    sessions.findFinishedForUser.mockResolvedValue(null);

    const missing = await request(app.getHttpServer())
      .get("/api/sessions/PL-NONE")
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .expect(404);

    const foreign = await request(app.getHttpServer())
      .get("/api/sessions/PL-AB12")
      .set("Authorization", `Bearer ${tokenFor(outsider)}`)
      .expect(404);

    expect(missing.body).toEqual(foreign.body);
    expect(JSON.stringify(missing.body)).not.toContain("Ana");
    expect(JSON.stringify(foreign.body)).not.toContain("Ana");
    expect(missing.body.podium).toBeUndefined();
    expect(foreign.body.podium).toBeUndefined();
  });

  it("returns 404 when no persisted finished session is visible", async () => {
    sessions.findFinishedForUser.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get("/api/sessions/PL-LIVE")
      .set("Authorization", `Bearer ${tokenFor(host)}`)
      .expect(404);

    expect(response.body.participants).toBeUndefined();
    expect(response.body.podium).toBeUndefined();
    expect(sessions.findFinishedForUser).toHaveBeenCalledWith("PL-LIVE", "host-1");
  });
});
