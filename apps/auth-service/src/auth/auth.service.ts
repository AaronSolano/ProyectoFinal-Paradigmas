import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User } from "@profelink/auth-prisma";
import { PasswordService } from "./password.service";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export type JwtPayload = {
  sub: string;
  email: string;
  displayName: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.users.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: dto.role,
    });
    return this.toPublicUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const valid = await this.passwords.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const accessToken = await this.signToken(user);
    return { accessToken, user: this.toPublicUser(user) };
  }

  buildJwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  private async signToken(user: User): Promise<string> {
    const payload = this.buildJwtPayload(user);
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_SECRET"),
      issuer: this.config.getOrThrow<string>("JWT_ISSUER"),
      audience: this.config.getOrThrow<string>("JWT_AUDIENCE"),
      expiresIn: "24h",
    });
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
