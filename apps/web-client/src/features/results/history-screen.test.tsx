import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DetailScreen, HistoryScreen } from "./history-screen";
import type { SessionDetail } from "./session-history";

const detail: SessionDetail = {
  roomCode: "PL-AB12",
  finishedAt: "2026-11-10T18:00:00.000Z",
  participants: [
    { userId: "zoe", displayName: "Zoe", score: 2, rank: 1 },
    { userId: "ana", displayName: "Ana", score: 1, rank: 2 },
  ],
  podium: [
    { userId: "zoe", displayName: "Zoe", score: 2, position: 1 },
    { userId: "ana", displayName: "Ana", score: 1, position: 2 },
  ],
};

function renderHistory(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe("pantallas de historial", () => {
  it("muestra el listado del profesor con código, fecha y participantes", () => {
    renderHistory(
      <HistoryScreen
        audience="host"
        detailPath={(roomCode) => `/profesor/historial/${roomCode}`}
        presentation={{ status: "ready", sessions: [detail] }}
      />,
    );

    expect(screen.getByText("PL-AB12")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText("1. Zoe · 2")).toBeInTheDocument();
    expect(screen.getByText("2. Ana · 1")).toBeInTheDocument();
    expect(screen.queryByText("teacher-1")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/profesor/historial/PL-AB12");
  });

  it("muestra al estudiante su puesto y su puntaje", () => {
    renderHistory(
      <HistoryScreen
        audience="student"
        detailPath={(roomCode) => `/estudiante/historial/${roomCode}`}
        presentation={{ status: "ready", sessions: [detail] }}
        viewerId="ana"
      />,
    );

    expect(screen.getByText("Tu posición 2 · Puntaje 1")).toBeInTheDocument();
  });

  it("muestra carga, vacío y error sin clasificación", () => {
    const view = renderHistory(<HistoryScreen audience="host" detailPath={() => "/profesor/historial/PL-AB12"} presentation={{ status: "loading" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando historial…");

    view.rerender(
      <MemoryRouter>
        <HistoryScreen audience="student" detailPath={() => "/estudiante/historial/PL-AB12"} presentation={{ status: "empty" }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Todavía no participas en partidas finalizadas.")).toBeInTheDocument();

    view.rerender(
      <MemoryRouter>
        <HistoryScreen
          audience="host"
          detailPath={() => "/profesor/historial/PL-AB12"}
          presentation={{ status: "error", message: "No se pudo cargar el historial." }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el historial.");
    expect(screen.queryByText("Zoe")).not.toBeInTheDocument();
  });

  it("abre el detalle y no muestra datos de una sala inexistente", () => {
    const view = renderHistory(
      <DetailScreen
        presentation={{ status: "ready", detail }}
        returnLabel="Volver al historial"
        returnTo="/estudiante/historial"
        viewerId="ana"
      />,
    );

    expect(screen.getByRole("heading", { name: "¡Reto completado!" })).toBeInTheDocument();
    expect(screen.getByText("Tu posición 2 · Puntaje 1")).toBeInTheDocument();

    view.rerender(
      <MemoryRouter>
        <DetailScreen
          presentation={{ status: "error", message: "Sesión no encontrada." }}
          returnLabel="Volver al historial"
          returnTo="/profesor/historial"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Sesión no encontrada.");
    expect(screen.queryByText("Zoe")).not.toBeInTheDocument();
    expect(screen.queryByTestId("podium-place")).not.toBeInTheDocument();
  });
});
