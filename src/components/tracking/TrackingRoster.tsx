import type { TrackingBoard } from "../../models/matches";
import { Panel } from "../../sports/ui";

export default function TrackingRoster({ board }: { board: TrackingBoard }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {board.teams.map((team) => (
        <Panel key={team.teamId} title={team.teamName}>
          <ul className="divide-y divide-white/5 px-4">
            {team.players.length === 0 ? (
              <li className="py-3 text-sm text-slate-400">No hay jugadores registrados en el seguimiento.</li>
            ) : (
              team.players.map((player) => (
                <li key={player.playerId} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      {player.jerseyNumber}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{player.name}</span>
                      <span className="block text-xs text-slate-400">{player.position}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[10px] text-slate-400">
                    X {player.x.toFixed(1)} · Y {player.y.toFixed(1)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
