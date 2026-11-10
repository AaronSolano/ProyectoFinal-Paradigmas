import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@profelink/auth-prisma";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { UsersService } from "../users/users.service";

describe("AuthService JWT payload", () => {
  const jwtSecret = "test-secret-key-for-jwt-signing";
  const jwtIssuer = "profelink-auth-service";
  const jwtAudience = "profelink-game-api";

  const config = {
    getOrThrow: (key: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: jwtSecret,
        JWT_ISSUER: jwtIssuer,
        JWT_AUDIENCE: jwtAudience,
      };
      return map[key];
    },
  } as ConfigService;

  const jwt = new JwtService({
    secret: jwtSecret,
    signOptions: { issuer: jwtIssuer, audience: jwtAudience },
  });

  const auth = new AuthService(
    {} as UsersService,
    {} as PasswordService,
    jwt,
    config,
  );

  it("builds payload with sub, email, displayName and role", () => {
    const payload = auth.buildJwtPayload({
      id: "11111111-1111-1111-1111-111111111111",
      email: "profe@profelink.cr",
      displayName: "Profesor",
      role: UserRole.HOST,
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(payload).toEqual({
      sub: "11111111-1111-1111-1111-111111111111",
      email: "profe@profelink.cr",
      displayName: "Profesor",
      role: UserRole.HOST,
    });
  });

  it("signs tokens with iss and aud claims", async () => {
    const token = await jwt.signAsync(
      {
        sub: "11111111-1111-1111-1111-111111111111",
        email: "profe@profelink.cr",
        displayName: "Profesor",
        role: UserRole.HOST,
      },
      {
        secret: jwtSecret,
        issuer: jwtIssuer,
        audience: jwtAudience,
      },
    );

    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.iss).toBe(jwtIssuer);
    expect(decoded.aud).toBe(jwtAudience);
    expect(decoded.sub).toBe("11111111-1111-1111-1111-111111111111");
    expect(decoded.role).toBe(UserRole.HOST);
  });
});
