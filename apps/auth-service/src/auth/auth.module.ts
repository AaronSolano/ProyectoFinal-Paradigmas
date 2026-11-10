import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          issuer: config.getOrThrow<string>("JWT_ISSUER"),
          audience: config.getOrThrow<string>("JWT_AUDIENCE"),
          expiresIn: "24h",
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, UsersService],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
