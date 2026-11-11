import { Link } from "react-router-dom";
import { ArenaFrame } from "../../shared/arena-frame";
import { paths } from "../../shared/paths";

export function TeacherPanelPage() {
  return (
    <ArenaFrame kicker="Profesor" title="Mesa de control" wide>
      <p className="max-w-xl text-lg leading-relaxed text-white/80">
        Arma un cuestionario con tus propias afirmaciones, incorpora retos del banco o inicia una partida.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Link
          className="rounded-2xl border border-vx-cyan/50 bg-vx-cyan/10 p-5 hover:border-vx-cyan hover:shadow-neon"
          to={paths.teacherCreate}
        >
          <span className="block text-xl font-semibold text-vx-cyan">Crea tu reto</span>
          <span className="mt-2 block text-base text-white/75">
            Redacta un cuestionario y sus preguntas de verdadero o falso.
          </span>
        </Link>
        <Link
          className="rounded-2xl border border-vx-magenta/50 bg-vx-magenta/10 p-5 hover:border-vx-magenta"
          to={paths.teacherExplore}
        >
          <span className="block text-xl font-semibold text-vx-magenta">Explora retos</span>
          <span className="mt-2 block text-base text-white/75">
            Filtra el banco, elige hasta 20 retos y cópialos a un cuestionario tuyo.
          </span>
        </Link>
        <Link
          className="rounded-2xl border border-white/20 bg-white/5 p-5 hover:border-vx-cyan hover:shadow-neon"
          to={paths.teacherStart}
        >
          <span className="block text-xl font-semibold text-white">Iniciar partida</span>
          <span className="mt-2 block text-base text-white/75">
            Elige un cuestionario, crea la sala y proyecta el código.
          </span>
        </Link>
        <Link
          className="rounded-2xl border border-[#f6c453]/40 bg-[#f6c453]/10 p-5 hover:border-[#f6c453]"
          to={paths.teacherHistory}
        >
          <span className="block text-xl font-semibold text-[#f6c453]">Historial de partidas</span>
          <span className="mt-2 block text-base text-white/75">
            Consulta las partidas finalizadas, su clasificación y el podio.
          </span>
        </Link>
      </div>
    </ArenaFrame>
  );
}
