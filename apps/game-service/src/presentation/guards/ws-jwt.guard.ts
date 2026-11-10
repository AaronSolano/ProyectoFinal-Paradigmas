import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import type { Socket } from "socket.io";
import { AuthUser } from "../../entities/auth-user";
import type { JwtPayload } from "../strategies/jwt-audience.strategy";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const user = this.authenticateSocket(client);
    client.data.user = user;
    return true;
  }

  authenticateSocket(client: Socket): AuthUser {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      throw new WsException("Token JWT requerido en auth.token.");
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>("JWT_SECRET"),
        issuer: this.config.getOrThrow<string>("JWT_ISSUER"),
        audience: this.config.getOrThrow<string>("JWT_AUDIENCE"),
      });
    } catch {
      throw new WsException("Token JWT inválido o expirado.");
    }

    const aud = payload.aud;
    const audienceOk = Array.isArray(aud)
      ? aud.includes("profelink-game-api")
      : aud === "profelink-game-api";
    if (!audienceOk) {
      throw new WsException("Token sin audiencia válida.");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
