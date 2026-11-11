import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { readClientEnv } from "./shared/env";
import "./styles/theme.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("VeriX no encontró el contenedor de la aplicación.");
}

createRoot(root).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
);

function Boot() {
  try {
    readClientEnv();
    return <App />;
  } catch {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4">
        <section className="rounded-3xl border border-vx-magenta/40 bg-panel p-8">
          <h1 className="text-4xl font-bold">VeriX</h1>
          <p className="mt-4 text-lg text-white/80">
            Falta la configuración local de los servicios. Revisa las variables del cliente sin agregar
            secretos.
          </p>
        </section>
      </main>
    );
  }
}
