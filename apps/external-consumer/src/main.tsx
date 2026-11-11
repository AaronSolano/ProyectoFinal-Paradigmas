import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConsumerPage } from "./consumer-page";
import "./styles/theme.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("VeriX no encontró el contenedor de la aplicación.");
}

createRoot(root).render(
  <StrictMode>
    <ConsumerPage />
  </StrictMode>,
);
