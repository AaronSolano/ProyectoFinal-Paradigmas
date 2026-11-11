import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtAudienceStrategy } from "./jwt-audience.strategy";

describe("JwtAudienceStrategy", () => {
  const config = {
    getOrThrow: (key: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: "test-secret",
        JWT_AUDIENCE: "profelink-game-api",
        JWT_ISSUER: "profelink-auth-service",
      };
      return map[key];
    },
  } as ConfigService;

  const strategy = new JwtAudienceStrategy(config);

  it("accepts payload with correct audience", () => {
    const user = strategy.validate({
      sub: "user-1",
      email: "a@b.cr",
      role: "HOST",
      aud: "profelink-game-api",
    });
    expect(user.userId).toBe("user-1");
  });

  it("rejects payload with mismatched audience", () => {
    expect(() =>
      strategy.validate({
        sub: "user-1",
        email: "a@b.cr",
        role: "HOST",
        aud: "other-api",
      }),
    ).toThrow(UnauthorizedException);
  });
});
