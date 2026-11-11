import { ConflictException, Injectable } from "@nestjs/common";
import { User, UserRole } from "@profelink/auth-prisma";
import { PrismaService } from "../prisma/prisma.service";

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException("El correo electrónico ya está registrado.");
    }

    return this.prisma.user.create({
      data: {
        email,
        passwordHash: input.passwordHash,
        displayName: input.displayName.trim(),
        role: input.role,
      },
    });
  }
}
