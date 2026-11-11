import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "@profelink/shared-dtos";
import { homePathForRole, paths } from "../../shared/paths";
import { useAuth } from "./auth-context";

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to={paths.login} replace />;
  }
  if (user.role !== role) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return children;
}
