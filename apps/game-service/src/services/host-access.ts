import { ForbiddenException } from "@nestjs/common";
import { AuthUser } from "../entities/auth-user";

export function assertHost(user: AuthUser): void {
  if (user.role !== "HOST") {
    throw new ForbiddenException("Solo un profesor puede realizar esta acción.");
  }
}
