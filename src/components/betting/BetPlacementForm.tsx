import { useState, type FormEvent } from "react";
import type {
  BetSelection,
  CreateBetInput,
  FanPaymentMethod,
  Match,
} from "../../models/betting";
import { Field } from "../../sports/ui";

interface BetPlacementFormProps {
  match: Match;
  paymentMethods: FanPaymentMethod[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateBetInput) => void;
}

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
});

const BetPlacementForm = ({
  match,
  paymentMethods,
  submitting,
  onCancel,
  onSubmit,
}: BetPlacementFormProps) => {
  const [selection, setSelection] = useState<BetSelection>("HOME");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? 0);
  const [stake, setStake] = useState("");

  const odd =
    selection === "HOME" ? match.homeOdd : selection === "AWAY" ? match.awayOdd : match.drawOdd;
  const stakeAmount = Number(stake);
  const bettingClosed =
    match.status === "FINISHED" ||
    match.status === "CANCELLED" ||
    match.status === "BETTING_CLOSED" ||
    match.status === "IN_PROGRESS" ||
    new Date(match.startsAt).getTime() <= Date.now();
  const canSubmit =
    !bettingClosed &&
    paymentMethodId > 0 &&
    Number.isFinite(stakeAmount) &&
    stakeAmount > 0 &&
    !submitting;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      matchId: match.id,
      fanPaymentMethodId: paymentMethodId,
      selection,
      stakeAmount,
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-[#1b3f63] bg-[#06101c] p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Selección" required>
          <select
            value={selection}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "HOME" || value === "AWAY" || value === "DRAW") {
                setSelection(value);
              }
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white"
          >
            <option value="HOME">{match.homeTeam} · {match.homeOdd.toFixed(2)}</option>
            <option value="DRAW">Empate · {match.drawOdd.toFixed(2)}</option>
            <option value="AWAY">{match.awayTeam} · {match.awayOdd.toFixed(2)}</option>
          </select>
        </Field>
        <Field label="Método de pago" required>
          <select
            required
            value={paymentMethodId || ""}
            onChange={(event) => setPaymentMethodId(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white"
          >
            <option value="" disabled>Selecciona un método</option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.paymentMethodName} · {method.maskedReference}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valor apostado" required>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={stake}
            onChange={(event) => setStake(event.target.value)}
            placeholder="Ingresa el valor"
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
          />
        </Field>
        <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
          <p className="text-xs font-semibold text-slate-400">Cuota fijada por el sistema</p>
          <p className="mt-1 text-sm font-bold text-[#3dff7a]">{odd.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">
            Retorno potencial: {currency.format(Number.isFinite(stakeAmount) ? stakeAmount * odd : 0)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
        >
          Cerrar
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-[#3dff7a] px-4 py-2 text-sm font-black text-[#04210f] transition hover:bg-[#62ff96] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Registrando…" : "Confirmar apuesta"}
        </button>
      </div>
    </form>
  );
};

export default BetPlacementForm;
