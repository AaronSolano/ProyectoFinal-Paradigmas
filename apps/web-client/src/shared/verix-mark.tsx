export function VerixMark({ compact = false }: { compact?: boolean }) {
  return (
    <h1
      aria-label="VeriX"
      className={compact ? "text-3xl font-bold tracking-tight" : "text-5xl font-bold tracking-tight"}
    >
      Veri
      <span className="bg-gradient-to-r from-vx-cyan to-vx-magenta bg-clip-text text-transparent">X</span>
    </h1>
  );
}
