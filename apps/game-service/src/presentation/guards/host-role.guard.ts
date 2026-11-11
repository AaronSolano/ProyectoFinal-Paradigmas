import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthUser } from "../../entities/auth-user";
import { assertHost } from "../../services/host-access";

@Injectable()
export class HostRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    assertHost(request.user ?? { userId: "", email: "", role: "" });
    return true;
  }
}
