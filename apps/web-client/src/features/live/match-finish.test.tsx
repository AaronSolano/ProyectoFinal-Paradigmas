import type { ComponentProps } from "react";
import type { GameFinishResultsPayload } from "@profelink/shared-dtos";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MatchFinish } from "./match-finish";

const result: GameFinishResultsPayload = {
  roomCode: "PL-TEST",
  podium: [
    { userId: "ana", displayName: "Ana", score: 3, position: 1 },
    { userId: "bea", displayName: "Bea", score: 2, position: 2 },
    { userId: "carlos", displayName: "Carlos", score: 1, position: 3 },
  ],
  finalLeaderboard: [
    { userId: "ana", displayName: "Ana", score: 3, rank: 1 },
    { userId: "bea", displayName: "Bea", score: 2, rank: 2 },
    { userId: "carlos", displayName: "Carlos", score: 1, rank: 3 },
    { userId: "dario", displayName: "Darío", score: 0, rank: 4 },
  ],
};

function show(
  payload: GameFinishResultsPayload,
  props: Partial<ComponentProps<typeof MatchFinish>> = {},
) {
  const view = render(
    <MemoryRouter>
      <MatchFinish
        connected
        result={payload}
        returnLabel="Volver al panel"
        returnTo="/profesor"
        {...props}
      />
    </MemoryRouter>,
  );
  return view;
}

describe("pantalla de podio", () => {
  it("dibuja los tres puestos y la clasificación completa", () => {
    show(result);

    expect(screen.getByRole("heading", { name: "¡Reto completado!" })).toBeInTheDocument();
    expect(screen.getByText("Desafía tus conocimientos")).toBeInTheDocument();
    expect(screen.getAllByTestId("podium-place").map((place) => place.getAttribute("data-position"))).toEqual([
      "2",
      "1",
      "3",
    ]);
    expect(screen.getAllByTestId("ranking-row").map((row) => row.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "1. Ana3",
      "2. Bea2",
      "3. Carlos1",
      "4. Darío0",
    ]);
    expect(screen.queryByText("host-1")).not.toBeInTheDocument();
  });

  it("omite los puestos que no llegaron", () => {
    show({
      ...result,
      podium: result.podium.slice(0, 1),
      finalLeaderboard: result.finalLeaderboard.slice(0, 1),
    });

    expect(screen.getAllByTestId("podium-place").map((place) => place.getAttribute("data-position"))).toEqual(["1"]);
    expect(screen.queryByText("Plata")).not.toBeInTheDocument();
    expect(screen.queryByText("Bronce")).not.toBeInTheDocument();
  });

  it("explica la sala sin participantes", () => {
    show({ roomCode: "PL-TEST", podium: [], finalLeaderboard: [] });

    expect(screen.getByText("No hay participantes en el podio.")).toBeInTheDocument();
    expect(screen.getByText("No hay participantes en la clasificación.")).toBeInTheDocument();
    expect(screen.queryByTestId("podium-place")).not.toBeInTheDocument();
  });

  it("resalta al estudiante y conserva el podio si se corta la conexión", () => {
    const view = show(result, { highlightUserId: "bea", returnLabel: "Volver al inicio", returnTo: "/estudiante" });

    expect(screen.getByText("Tu posición 2 · Puntaje 2")).toBeInTheDocument();
    expect(screen.getAllByTestId("ranking-row")[1]).toHaveAttribute("data-self", "true");

    view.rerender(
      <MemoryRouter>
        <MatchFinish
          connected={false}
          highlightUserId="bea"
          result={result}
          returnLabel="Volver al inicio"
          returnTo="/estudiante"
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Ana").length).toBeGreaterThan(0);
    expect(screen.getByText("La conexión se cerró. El resultado de esta pantalla se conserva.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/estudiante");
  });

  it("ofrece el regreso al panel del profesor", () => {
    show(result);

    expect(screen.getByRole("link", { name: "Volver al panel" })).toHaveAttribute("href", "/profesor");
  });
});
