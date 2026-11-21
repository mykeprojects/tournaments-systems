import type { Bet } from "../../models/betting";
import { EmptyNote, Panel } from "../../sports/ui";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const selectionLabel: Record<Bet["selection"], string> = {
  HOME: "Local",
  AWAY: "Visitante",
  DRAW: "Empate",
};

const statusLabel: Record<Bet["status"], string> = {
  REGISTERED: "Registrada",
  WON: "Ganada",
  LOST: "Perdida",
  VOIDED: "Anulada",
  CANCELLED: "Cancelada",
};

const statusStyle: Record<Bet["status"], string> = {
  REGISTERED: "bg-sky-400/15 text-sky-200",
  WON: "bg-emerald-400/15 text-emerald-200",
  LOST: "bg-red-400/15 text-red-200",
  VOIDED: "bg-amber-400/15 text-amber-100",
  CANCELLED: "bg-slate-400/15 text-slate-200",
};

interface BetsTableProps {
  bets: Bet[];
  showFan?: boolean;
  cancellingBetId?: number | null;
  onCancel?: (betId: number) => void;
}

export default function BetsTable({
  bets,
  showFan = false,
  cancellingBetId = null,
  onCancel,
}: BetsTableProps) {
  if (bets.length === 0) {
    return (
      <Panel title="Apuestas">
        <EmptyNote>No hay apuestas para mostrar.</EmptyNote>
      </Panel>
    );
  }

  return (
    <Panel title="Apuestas">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Partido</th>
              {showFan && <th className="px-4 py-3">Aficionado</th>}
              <th className="px-4 py-3">Selección</th>
              <th className="px-4 py-3">Apostado</th>
              <th className="px-4 py-3">Cuota</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Liquidación</th>
              <th className="px-4 py-3">Fecha</th>
              {onCancel && <th className="px-4 py-3">Acción</th>}
            </tr>
          </thead>
          <tbody>
            {bets.map((bet) => (
              <tr key={bet.id} className="border-b border-white/5 text-slate-200 last:border-0">
                <td className="px-4 py-3 font-semibold">
                  {bet.match ? `${bet.match.homeTeam} vs ${bet.match.awayTeam}` : `Partido #${bet.matchId}`}
                </td>
                {showFan && <td className="px-4 py-3">#{bet.fanExternalUserId ?? bet.fanId}</td>}
                <td className="px-4 py-3">{selectionLabel[bet.selection]}</td>
                <td className="px-4 py-3">{currency.format(bet.stakeAmount)}</td>
                <td className="px-4 py-3">{bet.lockedOdd.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[bet.status]}`}>
                    {statusLabel[bet.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {bet.status === "WON" ? (
                    <span className="font-bold text-emerald-200">
                      Ganaste {currency.format(bet.settledAmount)}
                    </span>
                  ) : bet.status === "LOST" ? (
                    <span className="text-red-200">Sin premio · {currency.format(0)}</span>
                  ) : bet.status === "VOIDED" ? (
                    <span className="text-amber-100">Devuelto {currency.format(bet.settledAmount)}</span>
                  ) : bet.status === "CANCELLED" ? (
                    <span className="text-slate-300">Apuesta cancelada</span>
                  ) : (
                    <span className="text-sky-200">Pendiente de liquidación</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {dateTime.format(new Date(bet.createdAt))}
                </td>
                {onCancel && (
                  <td className="px-4 py-3">
                    {bet.status === "REGISTERED" && (
                      <button
                        type="button"
                        disabled={cancellingBetId === bet.id}
                        onClick={() => onCancel(bet.id)}
                        className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-50"
                      >
                        {cancellingBetId === bet.id ? "Cancelando…" : "Cancelar"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
