import { UserRole } from "@profelink/shared-dtos";
import { Navigate, Route, Routes } from "react-router-dom";
import { GuestOnly, RequireRole } from "../features/auth/require-role";
import { LoginPage } from "../features/auth/login-page";
import { HostLobbyPage } from "../features/live/host-lobby-page";
import { StartMatchPage } from "../features/live/start-match-page";
import { StudentJoinPage } from "../features/live/student-join-page";

import { StudentPanelPage } from "../features/live/student-panel-page";
import { HostHistoryDetailPage, HostHistoryPage, StudentHistoryDetailPage, StudentHistoryPage } from "../features/results/history-pages";
import { ExplorePage } from "../features/quizzes/explore-page";
import { LibraryPage } from "../features/quizzes/library-page";
import { QuizEditorPage } from "../features/quizzes/quiz-editor-page";
import { TeacherPanelPage } from "../features/quizzes/teacher-panel-page";
import { homePathForRole, paths } from "../shared/paths";
import { useAuth } from "../features/auth/auth-context";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path={paths.login}
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path={paths.teacher}
        element={
          <RequireRole role={UserRole.HOST}>
            <TeacherPanelPage />
          </RequireRole>
        }
      />
      <Route
        path={paths.teacherCreate}
        element={
          <RequireRole role={UserRole.HOST}>
            <QuizEditorPage />
          </RequireRole>
        }
      />
      <Route
        path={paths.teacherExplore}
        element={
          <RequireRole role={UserRole.HOST}>
            <ExplorePage />
          </RequireRole>
        }
      />
      <Route
        path={paths.teacherLibrary}
        element={
          <RequireRole role={UserRole.HOST}>
            <LibraryPage />
          </RequireRole>
        }
      />
      <Route
        path={paths.teacherStart}
        element={
          <RequireRole role={UserRole.HOST}>
            <StartMatchPage />
          </RequireRole>
        }
      />
      <Route
        path={paths.teacherHistory}
        element={
          <RequireRole role={UserRole.HOST}>
            <HostHistoryPage />
          </RequireRole>
        }
      />
      <Route
        path="/profesor/historial/:roomCode"
        element={
          <RequireRole role={UserRole.HOST}>
            <HostHistoryDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/profesor/sala/:roomCode"
        element={
          <RequireRole role={UserRole.HOST}>
            <HostLobbyPage />
          </RequireRole>
        }
      />
      <Route path="/estudiante/sala/:roomCode" element={<StudentJoinPage />} />
      <Route
        path={paths.studentHistory}
        element={
          <RequireRole role={UserRole.PARTICIPANT}>
            <StudentHistoryPage />
          </RequireRole>
        }
      />
      <Route
        path="/estudiante/historial/:roomCode"
        element={
          <RequireRole role={UserRole.PARTICIPANT}>
            <StudentHistoryDetailPage />
          </RequireRole>
        }
      />
      <Route
        path={paths.student}
        element={
          <RequireRole role={UserRole.PARTICIPANT}>
            <StudentPanelPage />
          </RequireRole>
        }
      />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathForRole(user.role) : paths.login} replace />;
}
