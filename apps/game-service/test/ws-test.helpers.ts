import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, Socket } from "socket.io-client";
import { AppModule } from "../src/app.module";

export type WsTestContext = {
  app: INestApplication;
  jwt: JwtService;
  baseUrl: string;
  secret: string;
  issuer: string;
  audience: string;
};

export async function createWsTestApp(): Promise<WsTestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix("api", { exclude: ["uploads/(.*)"] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  await app.listen(0);

  const address = app.getHttpServer().address();
  const port = typeof address === "object" && address ? address.port : 3002;

  const jwt = moduleRef.get(JwtService);
  const secret = process.env.JWT_SECRET ?? "change-me-use-a-long-random-secret-in-production";
  const issuer = process.env.JWT_ISSUER ?? "profelink-auth-service";
  const audience = process.env.JWT_AUDIENCE ?? "profelink-game-api";

  return {
    app,
    jwt,
    baseUrl: `http://127.0.0.1:${port}`,
    secret,
    issuer,
    audience,
  };
}

export function signToken(
  ctx: WsTestContext,
  payload: Record<string, unknown>,
  aud = ctx.audience,
): string {
  return ctx.jwt.sign(payload, {
    secret: ctx.secret,
    issuer: ctx.issuer,
    audience: aud,
    expiresIn: "1h",
  });
}

export function connectClient(ctx: WsTestContext, token: string): Socket {
  return io(ctx.baseUrl, {
    transports: ["websocket"],
    auth: { token },
  });
}

export function waitForEvent<T>(
  socket: Socket,
  event: string,
  timeoutMs = 10_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${event}`));
    }, timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}
