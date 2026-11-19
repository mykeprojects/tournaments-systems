import type { TrackingBoard, TrackingPositionUpdate } from "../../models/matches";
import { EmptyNote, Panel } from "../../sports/ui";

const timeFormat = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export default function TrackingActivity({
  board,
  updates,
}: {
  board: TrackingBoard;
  updates: TrackingPositionUpdate[];
}) {
  return (
    <Panel title="Últimas actualizaciones de posición">
      {updates.length === 0 ? (
        <EmptyNote>Las actualizaciones en tiempo real aparecerán aquí.</EmptyNote>
      ) : (
        <ul className="divide-y divide-white/5 px-4">
          {updates.map((update, index) => {
            const player = update.playerId == null
              ? null
              : board.teams.flatMap((team) => team.players).find((item) => item.playerId === update.playerId);
            const team = update.teamId == null
              ? null
              : board.teams.find((item) => item.teamId === update.teamId);
            const label = update.subjectType === "BALL"
              ? board.ball.name
              : `${player?.name ?? `Jugador #${update.playerId}`} · ${team?.teamName ?? "Equipo"}`;

            return (
              <li key={`${update.recordedAt}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      update.subjectType === "BALL" ? "bg-amber-300" : "bg-emerald-400"
                    }`}
                  />
                  <span className="truncate text-xs text-slate-200">{label}</span>
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  X {update.x.toFixed(1)} / Y {update.y.toFixed(1)} · {timeFormat.format(new Date(update.recordedAt))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
