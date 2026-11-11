import { UserRole } from "@profelink/shared-dtos";

export const paths = {
  login: "/ingresar",
  teacher: "/profesor",
  teacherCreate: "/profesor/crear",
  teacherExplore: "/profesor/explora",
  teacherStart: "/profesor/iniciar",
  teacherHistory: "/profesor/historial",
  student: "/estudiante",
  studentHistory: "/estudiante/historial",
} as const;

export function teacherRoomPath(roomCode: string): string {
  return `/profesor/sala/${encodeURIComponent(roomCode)}`;
}

export function studentRoomPath(roomCode: string): string {
  return `/estudiante/sala/${encodeURIComponent(roomCode)}`;
}

export function teacherHistoryPath(roomCode: string): string {
  return `/profesor/historial/${encodeURIComponent(roomCode)}`;
}

export function studentHistoryPath(roomCode: string): string {
  return `/estudiante/historial/${encodeURIComponent(roomCode)}`;
}

export function homePathForRole(role: UserRole): string {
  return role === UserRole.HOST ? paths.teacher : paths.student;
}
