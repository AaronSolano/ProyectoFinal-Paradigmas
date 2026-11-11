import { Controller, Get, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { enableBrowserCors } from "./http-cors";

@Controller("probe")
class ProbeController {
  @Get()
  ok(): { ok: true } {
    return { ok: true };
  }
}

describe("auth-service browser HTTP CORS", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();

    app = moduleRef.createNestApplication();
    enableBrowserCors(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(["http://localhost:5173", "http://localhost:5174"])(
    "allows an HTTP response for %s",
    async (origin) => {
      const response = await request(app.getHttpServer())
        .get("/probe")
        .set("Origin", origin)
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe(origin);
      expect(response.headers["access-control-allow-origin"]).not.toBe("*");
    },
  );

  it.each(["http://localhost:5173", "http://localhost:5174"])(
    "answers preflight for %s",
    async (origin) => {
      for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
        const response = await request(app.getHttpServer())
          .options("/probe")
          .set("Origin", origin)
          .set("Access-Control-Request-Method", method)
          .set("Access-Control-Request-Headers", "authorization,content-type");

        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);
        expect(response.headers["access-control-allow-origin"]).toBe(origin);
        expect(String(response.headers["access-control-allow-methods"])).toContain(method);
        const allowHeaders = String(response.headers["access-control-allow-headers"]).toLowerCase();
        expect(allowHeaders).toContain("authorization");
        expect(allowHeaders).toContain("content-type");
      }
    },
  );

  it("does not grant access to an unauthorized origin", async () => {
    const foreign = "http://evil.example";

    const actual = await request(app.getHttpServer()).get("/probe").set("Origin", foreign);
    expect(actual.headers["access-control-allow-origin"]).toBeUndefined();

    const preflight = await request(app.getHttpServer())
      .options("/probe")
      .set("Origin", foreign)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");

    expect(preflight.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
