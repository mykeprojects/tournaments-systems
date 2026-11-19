import type { TrackingBoard } from "../../models/matches";
import { BallIcon } from "../../sports/glyphs";

type CourtKind = "football" | "volleyball" | "basketball" | "tennis" | "generic";

function courtKind(sportName: string): CourtKind {
  const sport = sportName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  if (sport.includes("voleibol") || sport.includes("volleyball")) return "volleyball";
  if (sport.includes("baloncesto") || sport.includes("basket")) return "basketball";
  if (sport.includes("tenis") || sport.includes("tennis")) return "tennis";
  if (sport.includes("futbol") || sport.includes("football") || sport.includes("soccer")) return "football";
  return "generic";
}

function CourtMarkings({ kind, width, height }: { kind: CourtKind; width: number; height: number }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const line = "rgba(255,255,255,.82)";
  const common = { fill: "none", stroke: line, strokeWidth: 0.45, vectorEffect: "non-scaling-stroke" as const };

  if (kind === "football") {
    return (
      <>
        <rect x="1" y="1" width={width - 2} height={height - 2} {...common} />
        <line x1={centerX} y1="1" x2={centerX} y2={height - 1} {...common} />
        <circle cx={centerX} cy={centerY} r={height * 0.14} {...common} />
        <circle cx={centerX} cy={centerY} r={height * 0.012} fill={line} />
        <rect x="1" y={height * 0.2} width={width * 0.16} height={height * 0.6} {...common} />
        <rect x="1" y={height * 0.34} width={width * 0.055} height={height * 0.32} {...common} />
        <rect x={width * 0.84} y={height * 0.2} width={width * 0.15} height={height * 0.6} {...common} />
        <rect x={width * 0.945} y={height * 0.34} width={width * 0.054} height={height * 0.32} {...common} />
      </>
    );
  }

  if (kind === "volleyball") {
    return (
      <>
        <rect x="1" y="1" width={width - 2} height={height - 2} {...common} />
        <line x1={centerX} y1="1" x2={centerX} y2={height - 1} stroke="rgba(255,255,255,.95)" strokeWidth="1.2" strokeDasharray="1 1" />
        <line x1={width * 0.34} y1="1" x2={width * 0.34} y2={height - 1} {...common} />
        <line x1={width * 0.66} y1="1" x2={width * 0.66} y2={height - 1} {...common} />
      </>
    );
  }

  if (kind === "basketball") {
    return (
      <>
        <rect x="1" y="1" width={width - 2} height={height - 2} {...common} />
        <line x1={centerX} y1="1" x2={centerX} y2={height - 1} {...common} />
        <circle cx={centerX} cy={centerY} r={height * 0.14} {...common} />
        <rect x="1" y={height * 0.25} width={width * 0.19} height={height * 0.5} {...common} />
        <rect x={width * 0.81} y={height * 0.25} width={width * 0.18} height={height * 0.5} {...common} />
        <circle cx={width * 0.2} cy={centerY} r={height * 0.11} {...common} />
        <circle cx={width * 0.8} cy={centerY} r={height * 0.11} {...common} />
      </>
    );
  }

  if (kind === "tennis") {
    return (
      <>
        <rect x="1" y="1" width={width - 2} height={height - 2} {...common} />
        <rect x={width * 0.08} y="1" width={width * 0.84} height={height - 2} {...common} />
        <line x1={centerX} y1="1" x2={centerX} y2={height - 1} stroke="rgba(255,255,255,.95)" strokeWidth="1.2" strokeDasharray="1 1" />
        <line x1={width * 0.08} y1={height * 0.25} x2={width * 0.92} y2={height * 0.25} {...common} />
        <line x1={width * 0.08} y1={height * 0.75} x2={width * 0.92} y2={height * 0.75} {...common} />
        <line x1={width * 0.25} y1={height * 0.25} x2={width * 0.25} y2={height * 0.75} {...common} />
        <line x1={width * 0.75} y1={height * 0.25} x2={width * 0.75} y2={height * 0.75} {...common} />
      </>
    );
  }

  return (
    <>
      <rect x="1" y="1" width={width - 2} height={height - 2} {...common} />
      <line x1={centerX} y1="1" x2={centerX} y2={height - 1} {...common} />
      <circle cx={centerX} cy={centerY} r={Math.min(width, height) * 0.14} {...common} />
    </>
  );
}

export default function TrackingCourt({ board }: { board: TrackingBoard }) {
  const kind = courtKind(board.sportName);

  const surface =
    kind === "football"
      ? "linear-gradient(140deg, #1d6035, #347b3d 48%, #205b32)"
      : kind === "volleyball"
        ? "linear-gradient(140deg, #9b653b, #bf8955 48%, #8d5a35)"
        : kind === "basketball"
          ? "linear-gradient(140deg, #9c542b, #c17a3e 48%, #8f4927)"
          : kind === "tennis"
            ? "linear-gradient(140deg, #176b70, #247f76 48%, #145b63)"
            : "linear-gradient(140deg, #33465b, #536477 48%, #293b50)";

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-white/20 shadow-inner"
      style={{ aspectRatio: `${board.field.width} / ${board.field.height}`, background: surface }}
      aria-label={`Pizarra de ${board.sportName}`}
      role="img"
    >
      <svg
        viewBox={`0 0 ${board.field.width} ${board.field.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <CourtMarkings kind={kind} width={board.field.width} height={board.field.height} />
      </svg>
      {board.teams.flatMap((team) =>
        team.players.map((player) => (
          <div
            key={player.playerId}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{
              left: `${(player.x / board.field.width) * 100}%`,
              top: `${(player.y / board.field.height) * 100}%`,
            }}
            title={`${player.name} · ${team.teamName} · ${player.position}`}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-[0_1px_8px_rgba(0,0,0,.75)] sm:h-8 sm:w-8 sm:text-xs"
              style={{ backgroundColor: team.color }}
            >
              {player.jerseyNumber}
            </span>
            <span className="mt-0.5 max-w-[5rem] truncate rounded bg-black/75 px-1 text-[8px] font-semibold leading-4 text-white sm:max-w-[6rem] sm:text-[10px]">
              {player.name}
            </span>
          </div>
        )),
      )}
      <div
        className="absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white text-slate-950 shadow-[0_2px_10px_rgba(0,0,0,.75)]"
        style={{
          left: `${(board.ball.x / board.field.width) * 100}%`,
          top: `${(board.ball.y / board.field.height) * 100}%`,
        }}
        title={`${board.ball.name} · X ${board.ball.x.toFixed(1)} / Y ${board.ball.y.toFixed(1)}`}
      >
        <BallIcon className="h-4 w-4" />
      </div>
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white/90">
        {board.field.width} × {board.field.height} · {board.sportName}
      </span>
    </div>
  );
}
