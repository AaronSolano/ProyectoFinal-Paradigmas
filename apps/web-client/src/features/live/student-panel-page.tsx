import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArenaFrame } from "../../shared/arena-frame";
import { paths, studentRoomPath } from "../../shared/paths";
import { normalizeRoomCode } from "./lobby-model";

export function StudentPanelPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const roomCode = normalizeRoomCode(code);
    if (!roomCode) {
      setError("Escribe el código de la sala.");
      return;
    }
    navigate(studentRoomPath(roomCode));
  }

  return (
    <ArenaFrame kicker="Estudiante" title="Listo para entrar">
      <p className="max-w-xl text-lg leading-relaxed text-white/80">
        Escribe el código de tu profesor o abre el enlace de invitación.
      </p>
      <form className="mt-8 max-w-xl" onSubmit={onSubmit}>
        <label className="block text-sm text-vx-cyan" htmlFor="room-code">
          Código de sala
          <input
            id="room-code"
            className="mt-2 w-full rounded-2xl border border-white/15 bg-ink px-4 py-4 text-2xl font-bold tracking-[0.16em] text-white uppercase"
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        {error ? (
          <p className="mt-3 text-vx-magenta" role="alert">
            {error}
          </p>
        ) : null}
        <button className="mt-4 w-full rounded-2xl bg-vx-magenta px-4 py-4 text-lg font-semibold text-ink" type="submit">
          Continuar
        </button>
      </form>
      <Link className="mt-6 inline-block text-vx-cyan" to={paths.studentHistory}>
        Historial de partidas
      </Link>
    </ArenaFrame>
  );
}
