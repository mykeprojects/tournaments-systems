import { useState, type FormEvent } from "react";
import type { OfficialResult } from "../../models/betting";
import type { MatchManagement } from "../../models/matches";
import { Field, Panel } from "../../sports/ui";
import { fieldClass, primaryButtonClass } from "../../sports/format";

const resultLabels: Record<OfficialResult, string> = {
  HOME: "Victoria del equipo local",
  AWAY: "Victoria del equipo visitante",
  DRAW: "Empate",
  VOID: "Anular encuentro",
};

export default function MatchResultForm({
  match,
  submitting,
  onSubmit,
}: {
  match: MatchManagement;
  submitting: boolean;
  onSubmit: (result: OfficialResult) => void;
}) {
  const [result, setResult] = useState<OfficialResult | "">("");
  const isTerminal = match.status === "FINISHED" || match.status === "CANCELLED";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (result) onSubmit(result);
  };

  return (
    <Panel title="Resultado oficial">
      <div className="p-4">
        {match.officialResult ? (
          <p className="mb-4 rounded-lg border border-[#3dff7a]/20 bg-[#3dff7a]/5 px-3 py-2 text-sm text-emerald-100">
            {resultLabels[match.officialResult]}
          </p>
        ) : (
          <p className="mb-4 text-sm text-slate-400">Todavía no se ha registrado un resultado.</p>
        )}
        {isTerminal ? (
          <p className="text-xs leading-5 text-amber-200">
            {match.status === "CANCELLED"
              ? "El partido está cancelado y su resultado ya no se puede modificar."
              : "El resultado de un partido finalizado no se puede modificar."}
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Resultado" required>
              <select
                value={result}
                onChange={(event) => setResult(event.target.value as OfficialResult | "")}
                className={fieldClass()}
                required
              >
                <option value="">Selecciona el resultado</option>
                <option value="HOME">{match.homeTeam} gana</option>
                <option value="AWAY">{match.awayTeam} gana</option>
                <option value="DRAW">Empate</option>
                <option value="VOID">Anular encuentro (VOID)</option>
              </select>
            </Field>
            <button type="submit" className={primaryButtonClass} disabled={submitting || !result}>
              {submitting ? "Guardando…" : "Registrar resultado"}
            </button>
          </form>
        )}
      </div>
    </Panel>
  );
}
