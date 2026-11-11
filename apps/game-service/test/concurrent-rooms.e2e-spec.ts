import { config } from "dotenv";
import { resolve } from "path";
import request from "supertest";
import { WsEventNames } from "@profelink/shared-dtos";
import {
  connectClient,
  createWsTestApp,
  signToken,
  waitForEvent,
  type WsTestContext,
} from "./ws-test.helpers";

config({ path: resolve(__dirname, "../../../.env") });

describe("Concurrent room isolation (e2e)", () => {
  let ctx: WsTestContext;

  const hostA = {
    sub: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email: "host-a@profelink.cr",
    role: "HOST",
  };
  const hostB = {
    sub: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    email: "host-b@profelink.cr",
    role: "HOST",
  };
  const studentB = {
    sub: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    email: "student-b@profelink.cr",
    role: "PARTICIPANT",
  };

  beforeAll(async () => {
    ctx = await createWsTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function createQuizWithQuestion(token: string) {
    const quiz = await request(ctx.app.getHttpServer())
      .post("/api/quizzes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "WS Quiz", description: "iso" })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .post(`/api/quizzes/${quiz.body.id}/questions`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        statement: "Pregunta V/F",
        correctAnswer: true,
        timeLimitSeconds: 15,
      })
      .expect(201);

    return quiz.body.id as string;
  }

  it("does not leak question events across rooms", async () => {
    const tokenA = signToken(ctx, hostA);
    const tokenB = signToken(ctx, hostB);
    const tokenStudentB = signToken(ctx, studentB);

    const quizA = await createQuizWithQuestion(tokenA);
    const quizB = await createQuizWithQuestion(tokenB);

    const roomA = await request(ctx.app.getHttpServer())
      .post(`/api/quizzes/${quizA}/sessions`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(201);

    const roomB = await request(ctx.app.getHttpServer())
      .post(`/api/quizzes/${quizB}/sessions`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(201);

    const codeA = roomA.body.roomCode as string;
    const codeB = roomB.body.roomCode as string;

    const hostClientA = connectClient(ctx, tokenA);
    const hostClientB = connectClient(ctx, tokenB);
    const studentClientB = connectClient(ctx, tokenStudentB);

    await Promise.all([
      new Promise<void>((res) => hostClientA.on("connect", () => res())),
      new Promise<void>((res) => hostClientB.on("connect", () => res())),
      new Promise<void>((res) => studentClientB.on("connect", () => res())),
    ]);

    hostClientA.emit(WsEventNames.ROOM_JOIN, { roomCode: codeA });
    hostClientB.emit(WsEventNames.ROOM_JOIN, { roomCode: codeB });
    studentClientB.emit(WsEventNames.ROOM_JOIN, { roomCode: codeB });

    await waitForEvent(hostClientA, WsEventNames.ROOM_STATE_SYNC);
    await waitForEvent(hostClientB, WsEventNames.ROOM_STATE_SYNC);
    await waitForEvent(studentClientB, WsEventNames.ROOM_STATE_SYNC);

    const leaked = new Promise<void>((resolve, reject) => {
      studentClientB.once(WsEventNames.GAME_QUESTION_OPENED, () => {
        reject(new Error("SALA_B recibió evento de SALA_A"));
      });
      setTimeout(resolve, 500);
    });

    hostClientA.emit(WsEventNames.GAME_START_QUESTION, { questionIndex: 0 });
    await waitForEvent(hostClientA, WsEventNames.GAME_QUESTION_OPENED);

    await leaked;

    hostClientA.disconnect();
    hostClientB.disconnect();
    studentClientB.disconnect();

    await request(ctx.app.getHttpServer())
      .delete(`/api/quizzes/${quizA}`)
      .set("Authorization", `Bearer ${tokenA}`);
    await request(ctx.app.getHttpServer())
      .delete(`/api/quizzes/${quizB}`)
      .set("Authorization", `Bearer ${tokenB}`);
  });
});
