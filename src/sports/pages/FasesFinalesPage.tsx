import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fieldClass, primaryButtonClass } from "../format";
import { TrophyIcon } from "../glyphs";
import type { Tournament } from "../tournamentApi";
import {
  deleteBracket,
  generateBrackets,
  bracketError,
  listBrackets,
  listPhases,
  listTournaments,
  ROUND_LABEL,
  saveBracket,
  setBracketWinner,
  type BracketRound,
  type TournamentBracket,
  type TournamentPhase,
} from "../tournamentBracketApi";
import {
  EmptyNote,
  Field,
  IconButton,
  Modal,
  NoticeBanner,
  PageHeader,
  Panel,
  type Notice,
} from "../ui";

const ROUNDS: BracketRound[] = ["QUARTERFINAL", "SEMIFINAL", "FINAL"];

export default function FasesFinalesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [brackets, setBrackets] = useState<TournamentBracket[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [roundType, setRoundType] = useState<BracketRound>("QUARTERFINAL");
  const [bracketOrder, setBracketOrder] = useState(1);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [winnerTeamId, setWinnerTeamId] = useState("");

  const selectedPhase = useMemo(
    () => phases.find((phase) => String(phase.id) === phaseId) ?? null,
    [phases, phaseId],
  );

  const reloadBrackets = async (selectedTournamentId: number, selectedPhaseId: number) => {
    setBrackets(await listBrackets(selectedTournamentId, selectedPhaseId));
  };

  useEffect(() => {
    document.title = "Fases Finales · Sports System+";
    void (async () => {
      try {
        const items = await listTournaments();
        setTournaments(items);
        if (items.length) setTournamentId(String(items[0].id));
      } catch (error) {
        setNotice({ tone: "error", title: "No se pudieron cargar los torneos", message: bracketError(error) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setPhases([]);
      setPhaseId("");
      return;
    }
    void (async () => {
      try {
        const items = await listPhases(Number(tournamentId));
        setPhases(items);
        const knockout = items.find((phase) => phase.phaseType === "KNOCKOUT");
        setPhaseId(knockout ? String(knockout.id) : "");
      } catch (error) {
        setNotice({ tone: "error", title: "No se pudieron cargar las fases", message: bracketError(error) });
      }
    })();
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId || !phaseId) {
      setBrackets([]);
      return;
    }
    void reloadBrackets(Number(tournamentId), Number(phaseId)).catch((error) => {
      setNotice({ tone: "error", title: "No se pudieron cargar las llaves", message: bracketError(error) });
    });
  }, [tournamentId, phaseId]);

  const openManual = () => {
    setRoundType("QUARTERFINAL");
    setBracketOrder(brackets.length + 1);
    setTeamAId("");
    setTeamBId("");
    setWinnerTeamId("");
    setModalOpen(true);
  };

  const handleGenerate = async () => {
    if (!tournamentId || !phaseId) return;
    try {
      const result = await generateBrackets(Number(tournamentId), Number(phaseId));
      setBrackets(result);
      setNotice({ tone: "ok", message: "Llaves eliminatorias generadas correctamente." });
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudieron generar", message: bracketError(error) });
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tournamentId || !phaseId) return;
    try {
      await saveBracket(Number(tournamentId), Number(phaseId), {
        roundType,
        bracketOrder,
        teamAId: teamAId ? Number(teamAId) : null,
        teamBId: teamBId ? Number(teamBId) : null,
        winnerTeamId: winnerTeamId ? Number(winnerTeamId) : null,
        status: winnerTeamId ? "FINISHED" : "PENDING",
      });
      setNotice({ tone: "ok", message: "Cruce guardado correctamente." });
      setModalOpen(false);
      await reloadBrackets(Number(tournamentId), Number(phaseId));
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo guardar", message: bracketError(error) });
    }
  };

  const handleWinner = async (bracket: TournamentBracket, teamId: number) => {
    if (!tournamentId || !phaseId) return;
    try {
      await setBracketWinner(Number(tournamentId), Number(phaseId), bracket.id, teamId);
      setNotice({ tone: "ok", message: "Ganador registrado correctamente." });
      await reloadBrackets(Number(tournamentId), Number(phaseId));
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo registrar", message: bracketError(error) });
    }
  };

  const handleDelete = async (bracket: TournamentBracket) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cruce?")) return;
    try {
      const result = await deleteBracket(Number(tournamentId), Number(phaseId), bracket.id);
      setNotice({ tone: "ok", message: result.message });
      await reloadBrackets(Number(tournamentId), Number(phaseId));
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo eliminar", message: bracketError(error) });
    }
  };

  return (
    <div>
      <PageHeader
        icon={<TrophyIcon />}
        title="Fases Finales"
        subtitle="Administra llaves, cruces y equipos clasificados"
        actions={
          selectedPhase?.phaseType === "KNOCKOUT" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleGenerate()} className={primaryButtonClass}>Generar llaves</button>
              <button type="button" onClick={openManual} className="rounded-lg border border-[#245078] px-4 py-2.5 text-sm font-semibold text-slate-200">Agregar cruce</button>
            </div>
          ) : undefined
        }
      />
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      {loading ? (
        <EmptyNote>Cargando torneos…</EmptyNote>
      ) : tournaments.length === 0 ? (
        <EmptyNote>No hay torneos registrados.</EmptyNote>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <select value={tournamentId} onChange={(event) => setTournamentId(event.target.value)} className={fieldClass()} aria-label="Seleccionar torneo">
              {tournaments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={phaseId} onChange={(event) => setPhaseId(event.target.value)} className={fieldClass()} aria-label="Seleccionar fase eliminatoria">
              <option value="">Seleccionar fase eliminatoria</option>
              {phases.filter((phase) => phase.phaseType === "KNOCKOUT").map((phase) => (
                <option key={phase.id} value={phase.id}>{phase.name}</option>
              ))}
            </select>
          </div>

          {selectedPhase?.phaseType !== "KNOCKOUT" ? (
            <EmptyNote>Selecciona una fase de tipo eliminatoria.</EmptyNote>
          ) : (
            ROUNDS.map((round) => {
              const roundBrackets = brackets.filter((bracket) => bracket.roundType === round);
              if (roundBrackets.length === 0) return null;
              return (
                <Panel key={round} title={ROUND_LABEL[round]} className="mb-4">
                  <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                    {roundBrackets.map((bracket) => (
                      <article key={bracket.id} className="rounded-xl border border-[#245078] bg-[#06101c] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">Cruce {bracket.bracketOrder}</span>
                          <IconButton label="Eliminar cruce" tone="delete" onClick={() => void handleDelete(bracket)} />
                        </div>
                        {[bracket.teamA, bracket.teamB].map((team, index) => (
                          <button
                            key={`${bracket.id}-${index}`}
                            type="button"
                            disabled={!team}
                            onClick={() => team && void handleWinner(bracket, team.id)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                              team?.id === bracket.winnerTeamId
                                ? "bg-[#3dff7a] font-black text-[#04210f]"
                                : "bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                            } ${index === 0 ? "mb-2" : ""}`}
                          >
                            <span>{team?.name ?? "Por definir"}</span>
                            {team?.id === bracket.winnerTeamId && <span>Ganador</span>}
                          </button>
                        ))}
                      </article>
                    ))}
                  </div>
                </Panel>
              );
            })
          )}
          {selectedPhase?.phaseType === "KNOCKOUT" && brackets.length === 0 && (
            <EmptyNote>No hay cruces registrados.</EmptyNote>
          )}
        </>
      )}

      {modalOpen && (
        <Modal title="Agregar cruce" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <Field label="Ronda">
              <select value={roundType} onChange={(event) => setRoundType(event.target.value as BracketRound)} className={fieldClass()}>
                {ROUNDS.map((round) => <option key={round} value={round}>{ROUND_LABEL[round]}</option>)}
              </select>
            </Field>
            <Field label="Orden">
              <input type="number" min={1} value={bracketOrder} onChange={(event) => setBracketOrder(Number(event.target.value))} className={fieldClass()} />
            </Field>
            <Field label="Equipo A">
              <input type="number" min={1} value={teamAId} onChange={(event) => setTeamAId(event.target.value)} className={fieldClass()} placeholder="ID del equipo" />
            </Field>
            <Field label="Equipo B">
              <input type="number" min={1} value={teamBId} onChange={(event) => setTeamBId(event.target.value)} className={fieldClass()} placeholder="ID del equipo" />
            </Field>
            <Field label="Ganador">
              <input type="number" min={1} value={winnerTeamId} onChange={(event) => setWinnerTeamId(event.target.value)} className={fieldClass()} placeholder="ID del ganador" />
            </Field>
            <div className="flex items-end justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">Cancelar</button>
              <button type="submit" className={primaryButtonClass}>Guardar cruce</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
