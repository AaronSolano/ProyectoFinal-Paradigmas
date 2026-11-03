import { config } from "dotenv";
import { resolve } from "path";
import request from "supertest";
import { WsEventNames } from "@profelink/shared-dtos";
import type { RoomStateSyncPayload } from "@profelink/shared-dtos";
import {
  connectClient,
  createWsTestApp,
  signToken,
  waitForEvent,
  type WsTestContext,
} from "./ws-test.helpers";

config({ path: resolve(__dirname, "../../../.env") });

describe("Participant reconnection", () => {
  let ctx: WsTestContext;

  const host = {
    sub: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    email: "host-r@profelink.cr",
    role: "HOST",
  };
  const student = {
    sub: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    email: "student-r@profelink.cr",
    role: "PARTICIPANT",
  };

  beforeAll(async () => {
    ctx = await createWsTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("preserves score and emits room:state_sync without duplicating participants", async () => {
    const hostToken = signToken(ctx, host);
    const studentToken = signToken(ctx, student);

    const quiz = await request(ctx.app.getHttpServer())
      .post("/api/quizzes")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ title: "Reconnect Quiz" })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post(`/api/quizzes/${quiz.body.id}/questions`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        statement: "Reconexión OK",
        correctAnswer: true,
        timeLimitSeconds: 20,
      })
      .expect(201);

    const session = await request(ctx.app.getHttpServer())
      .post(`/api/quizzes/${quiz.body.id}/sessions`)
      .set("Authorization", `Bearer ${hostToken}`)
      .expect(201);

    const roomCode = session.body.roomCode as string;

    const hostClient = connectClient(ctx, hostToken);
    await new Promise<void>((res) => hostClient.on("connect", () => res()));
    hostClient.emit(WsEventNames.ROOM_JOIN, { roomCode });
    await waitForEvent(hostClient, WsEventNames.ROOM_STATE_SYNC);

    let studentClient = connectClient(ctx, studentToken);
    await new Promise<void>((res) => studentClient.on("connect", () => res()));
    studentClient.emit(WsEventNames.ROOM_JOIN, { roomCode, displayName: "Ana" });
    await waitForEvent(studentClient, WsEventNames.ROOM_STATE_SYNC);

    hostClient.emit(WsEventNames.GAME_START_QUESTION, { questionIndex: 0 });
    await waitForEvent(studentClient, WsEventNames.GAME_QUESTION_OPENED);

    studentClient.emit(WsEventNames.GAME_SUBMIT_ANSWER, { answer: true });
    const ack = await waitForEvent<{ accepted: boolean }>(
      studentClient,
      WsEventNames.GAME_ANSWER_ACK,
    );
    expect(ack.accepted).toBe(true);

    studentClient.disconnect();

    studentClient = connectClient(ctx, studentToken);
    await new Promise<void>((res) => studentClient.on("connect", () => res()));
    studentClient.emit(WsEventNames.ROOM_JOIN, { roomCode, displayName: "Ana" });

    const sync = await waitForEvent<RoomStateSyncPayload>(
      studentClient,
      WsEventNames.ROOM_STATE_SYNC,
    );

    expect(sync.myScore).toBe(1);
    expect(sync.hasAnsweredCurrentQuestion).toBe(true);
    expect(sync.participants.filter((p) => p.userId === student.sub)).toHaveLength(1);

    hostClient.disconnect();
    studentClient.disconnect();

    await request(ctx.app.getHttpServer())
      .delete(`/api/quizzes/${quiz.body.id}`)
      .set("Authorization", `Bearer ${hostToken}`);
  });
});
