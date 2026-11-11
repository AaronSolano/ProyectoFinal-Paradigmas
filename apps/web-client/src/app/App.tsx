import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/auth-context";
import { AppRoutes } from "./router";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
