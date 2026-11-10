import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthUser } from "../../entities/auth-user";

export type JwtPayload = {
  sub: string;
  email: string;
  displayName?: string;
  role: string;
  aud?: string | string[];
  iss?: string;
};

@Injectable()
export class JwtAudienceStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
      audience: config.getOrThrow<string>("JWT_AUDIENCE"),
      issuer: config.getOrThrow<string>("JWT_ISSUER"),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    const aud = payload.aud;
    const audienceOk = Array.isArray(aud)
      ? aud.includes("profelink-game-api")
      : aud === "profelink-game-api";
    if (!audienceOk) {
      throw new UnauthorizedException("Token sin audiencia válida.");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
