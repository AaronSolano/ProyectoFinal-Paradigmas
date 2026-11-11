import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { paths } from "./paths";
import { VerixMark } from "./verix-mark";

export function visibleIdentity(displayName: string | undefined): string | null {
  const name = displayName?.trim() ?? "";
  if (!name || /profelink/i.test(name)) {
    return null;
  }
  return name;
}

export function ArenaFrame({
  kicker,
  title,
  children,
  wide = false,
  align = "center",
  workspace = false,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
  align?: "center" | "start";
  workspace?: boolean;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const identity = visibleIdentity(user?.displayName);

  function onLogout() {
    logout();
    navigate(paths.login, { replace: true });
  }

  return (
    <main
      className={
        workspace
          ? "mx-auto flex min-h-screen w-full max-w-[96rem] flex-col px-3 py-3 sm:px-6 sm:py-4 lg:h-dvh lg:max-h-dvh lg:overflow-hidden"
          : `mx-auto flex min-h-screen w-full flex-col px-4 py-6 sm:px-6 sm:py-10 ${wide ? "max-w-5xl" : "max-w-3xl"}`
      }
    >
      <header className="flex items-center justify-between gap-4">
        <VerixMark compact />
        <button
          className="rounded-2xl border border-white/15 px-4 py-3 text-base font-medium hover:border-vx-magenta"
          type="button"
          onClick={onLogout}
        >
          Salir
        </button>
      </header>
      <section
        className={
          workspace
            ? "mt-3 flex min-h-0 flex-1 flex-col rounded-3xl border border-vx-cyan/30 bg-panel/90 p-4 shadow-neon sm:p-5"
            : `mt-8 flex flex-1 flex-col rounded-3xl border border-vx-cyan/30 bg-panel/90 p-6 shadow-neon sm:p-10 ${align === "start" ? "justify-start" : "justify-center"}`
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-vx-cyan">{kicker}</p>
            <h2 className={workspace ? "mt-1 text-3xl font-bold" : "mt-3 text-4xl font-bold sm:text-5xl"}>{title}</h2>
          </div>
          {identity ? <p className="text-base text-white/75">{identity}</p> : null}
        </div>
        <div className={workspace ? "mt-4 flex min-h-0 flex-1 flex-col" : "mt-8"}>{children}</div>
      </section>
    </main>
  );
}
