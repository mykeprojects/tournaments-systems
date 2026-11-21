import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { hasApplicationRole } from "../../domain/authorization/roleAccess";
import { useAuth } from "../../hooks/useAuth";
import { fieldClass, formatDate, primaryButtonClass } from "../format";
import { ChartIcon } from "../glyphs";
import {
  deleteMatch,
  listMatches,
  listPhases,
  listRegistrations,
  listTournaments,
  MATCH_STATUS_LABEL,
  matchError,
  saveMatch,
  type Match,
  type MatchStatus,
} from "../matchApi";
import type { Tournament } from "../tournamentApi";
import type { TournamentPhase } from "../tournamentPhaseApi";
import type { TournamentRegistration } from "../tournamentRegistrationApi";
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

type FormState = {
  id?: number;
  phaseId: number;
  roundLabel: string;
  homeTeamId: number;
  awayTeamId: number;
  startsAt: string;
  venue: string;
  homeOdd: number;
  awayOdd: number;
  drawOdd: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalInput = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
};

const defaultStart = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return toLocalInput(date.toISOString());
};

const emptyForm = (phaseId: number): FormState => ({
  phaseId,
  roundLabel: "",
  homeTeamId: 0,
  awayTeamId: 0,
  startsAt: defaultStart(),
  venue: "",
  homeOdd: 2,
  awayOdd: 2,
  drawOdd: 3,
});

const statusClass: Record<MatchStatus, string> = {
  SCHEDULED: "bg-sky-400/15 text-sky-300",
  BETTING_OPEN: "bg-emerald-400/15 text-emerald-300",
  BETTING_CLOSED: "bg-amber-300/15 text-amber-200",
  IN_PROGRESS: "bg-purple-400/15 text-purple-300",
  FINISHED: "bg-slate-400/15 text-slate-300",
  CANCELLED: "bg-red-400/15 text-red-300",
};

export default function PartidosPage() {
  const { hasPermission, roles } = useAuth();
  const roleNames = roles.map((role) => role.name);
  const isFan = hasApplicationRole(roleNames, "fan") && !hasApplicationRole(roleNames, "sportsAdmin");
  const canViewMatches = hasPermission("matches.view");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [phaseFilter, setPhaseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SCHEDULED" | "IN_PROGRESS" | "FINISHED">("ALL");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const canManageMatches = hasApplicationRole(roleNames, "sportsAdmin");

  const selectedTournament = useMemo(
    () => tournaments.find((item) => String(item.id) === tournamentId) ?? null,
    [tournaments, tournamentId],
  );
  const phaseById = useMemo(
    () => new Map(phases.map((phase) => [phase.id, phase])),
    [phases],
  );
  const teamById = useMemo(
    () => new Map(registrations.map((item) => [item.teamId, item.team])),
    [registrations],
  );

  const visibleMatches = useMemo(() => {
    if (!isFan || statusFilter === "ALL") return matches;
    if (statusFilter === "SCHEDULED") {
      return matches.filter((match) =>
        match.status === "SCHEDULED" ||
        match.status === "BETTING_OPEN" ||
        match.status === "BETTING_CLOSED",
      );
    }
    if (statusFilter === "IN_PROGRESS") return matches.filter((match) => match.status === "IN_PROGRESS");
    return matches.filter((match) => match.status === "FINISHED");
  }, [isFan, matches, statusFilter]);


  const loadInitialData = useCallback(async () => {
    document.title = "Partidos - Sports System";
    setLoading(true);
    try {
      let tournamentList: Tournament[] = [];
      try {
        tournamentList = await listTournaments();
        setTournaments(tournamentList);
        if (tournamentList.length) {
          setTournamentId(String(tournamentList[0].id));
        }
      } catch {
        setTournaments([]);
      }

      const initialTournamentId = tournamentList.length ? tournamentList[0].id : undefined;
      try {
        const initialMatches = await listMatches(initialTournamentId);
        setMatches(initialMatches);
      } catch (error) {
        if (isFan) {
          const all = await listMatches();
          setMatches(initialTournamentId ? all.filter((m) => m.tournamentId === initialTournamentId) : all);
        } else {
          throw error;
        }
      }
    } catch (error) {
      setNotice({
        tone: "error",
        title: "No se pudieron cargar los partidos",
        message: matchError(error),
      });
    } finally {
      setLoading(false);
    }
  }, [isFan]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!tournamentId) {
      setPhases([]);
      setRegistrations([]);
      return;
    }
    const id = Number(tournamentId);
    void Promise.all([
      listPhases(id).catch(() => []),
      listRegistrations(id).catch(() => []),
    ]).then(([phaseItems, registrationItems]) => {
      setPhases(phaseItems);
      setRegistrations(registrationItems);
    });
  }, [tournamentId]);

  useEffect(() => {
    if (loading) return;
    const tId = tournamentId ? Number(tournamentId) : undefined;
    const pId = phaseFilter ? Number(phaseFilter) : undefined;
    void (async () => {
      try {
        const items = await listMatches(tId, pId);
        setMatches(items);
      } catch (error) {
        if (isFan) {
          try {
            const all = await listMatches();
            setMatches(
              all.filter((m) => {
                if (tId && m.tournamentId !== tId) return false;
                if (pId && m.phaseId !== pId) return false;
                return true;
              }),
            );
            return;
          } catch {
            // fall through to notice
          }
        }
        setNotice({
          tone: "error",
          title: "No se pudieron cargar los partidos",
          message: matchError(error),
        });
      }
    })();
  }, [tournamentId, phaseFilter, loading, isFan]);

  const reloadMatches = async () => {
    const tId = tournamentId ? Number(tournamentId) : undefined;
    const pId = phaseFilter ? Number(phaseFilter) : undefined;
    try {
      setMatches(await listMatches(tId, pId));
    } catch (error) {
      if (isFan) {
        const all = await listMatches();
        setMatches(
          all.filter((m) => {
            if (tId && m.tournamentId !== tId) return false;
            if (pId && m.phaseId !== pId) return false;
            return true;
          }),
        );
        return;
      }
      throw error;
    }
  };

  const openCreate = () => {
    const phaseId = phaseFilter ? Number(phaseFilter) : (phases[0]?.id ?? 0);
    setForm(emptyForm(phaseId));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (match: Match) => {
    setForm({
      id: match.id,
      phaseId: match.phaseId ?? 0,
      roundLabel: match.roundLabel ?? "",
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      startsAt: toLocalInput(match.startsAt),
      venue: match.venue ?? "",
      homeOdd: match.homeOdd,
      awayOdd: match.awayOdd,
      drawOdd: match.drawOdd,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTournament) return;

    const nextErrors: Record<string, string> = {};
    if (!form.homeTeamId) nextErrors.homeTeamId = "Selecciona el equipo local.";
    if (!form.awayTeamId) nextErrors.awayTeamId = "Selecciona el equipo visitante.";
    if (form.homeTeamId && form.homeTeamId === form.awayTeamId) {
      nextErrors.awayTeamId = "Los equipos deben ser diferentes.";
    }
    if (!form.startsAt) nextErrors.startsAt = "Selecciona la fecha y hora.";
    if (form.startsAt && new Date(form.startsAt).getTime() <= Date.now()) {
      nextErrors.startsAt = "La fecha debe ser futura.";
    }
    if (form.homeOdd < 1) nextErrors.homeOdd = "La cuota debe ser al menos 1.";
    if (form.awayOdd < 1) nextErrors.awayOdd = "La cuota debe ser al menos 1.";
    if (form.drawOdd < 1) nextErrors.drawOdd = "La cuota debe ser al menos 1.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const home = teamById.get(form.homeTeamId);
    const away = teamById.get(form.awayTeamId);
    if (!home || !away) {
      setNotice({
        tone: "error",
        title: "Equipos no válidos",
        message: "Solo se pueden programar equipos inscritos en el torneo.",
      });
      return;
    }

    try {
      await saveMatch(selectedTournament.id, {
        id: form.id,
        phaseId: form.phaseId || undefined,
        roundLabel: form.roundLabel,
        homeTeam: home.name,
        awayTeam: away.name,
        homeTeamId: home.id,
        awayTeamId: away.id,
        venue: form.venue,
        startsAt: new Date(form.startsAt).toISOString(),
        homeOdd: form.homeOdd,
        awayOdd: form.awayOdd,
        drawOdd: form.drawOdd,
      });
      setNotice({
        tone: "ok",
        message: form.id ? "Partido actualizado correctamente." : "Partido programado correctamente.",
      });
      setModalOpen(false);
      await reloadMatches();
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo guardar", message: matchError(error) });
    }
  };

  const handleDelete = async (match: Match) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el partido ${match.homeTeam} vs ${match.awayTeam}?`)) {
      return;
    }
    try {
      const result = await deleteMatch(match.id);
      setNotice({ tone: "ok", message: result.message });
      await reloadMatches();
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo eliminar", message: matchError(error) });
    }
  };

  return (
    <div>
      <PageHeader
        icon={<ChartIcon />}
        title="Partidos"
        subtitle="Consulta los encuentros programados y el calendario deportivo"
        actions={
          selectedTournament && canManageMatches ? (
            <button type="button" onClick={openCreate} className={primaryButtonClass}>
              + Nuevo partido
            </button>
          ) : undefined
        }
      />
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      {!canViewMatches ? (
        <EmptyNote>No tienes permiso para consultar partidos.</EmptyNote>
      ) : loading ? (
        <EmptyNote>Cargando partidos…</EmptyNote>
      ) : (
        <>
          {tournaments.length > 0 && (
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <select
                value={tournamentId}
                onChange={(event) => {
                  setTournamentId(event.target.value);
                  setPhaseFilter("");
                }}
                className={fieldClass()}
                aria-label="Seleccionar torneo"
              >
                {tournaments.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <select
                value={phaseFilter}
                onChange={(event) => setPhaseFilter(event.target.value)}
                className={fieldClass()}
                aria-label="Filtrar por fase"
              >
                <option value="">Todas las fases</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </select>
              {isFan && (
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                  className={fieldClass()}
                  aria-label="Filtrar partidos por estado"
                >
                  <option value="ALL">Todos los partidos</option>
                  <option value="SCHEDULED">Partidos agendados</option>
                  <option value="IN_PROGRESS">Partidos en curso</option>
                  <option value="FINISHED">Partidos finalizados</option>
                </select>
              )}
            </div>
          )}

          {selectedTournament && (
            <p className="mb-3 text-xs text-slate-400">
              Torneo del {formatDate(selectedTournament.startDate)} al {formatDate(selectedTournament.endDate)} ·{" "}
              {registrations.length} equipo(s) inscrito(s)
            </p>
          )}

          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-semibold">Partido</th>
                    <th className="px-3 py-3 font-semibold">Fase</th>
                    <th className="px-3 py-3 font-semibold">Ronda</th>
                    <th className="px-3 py-3 font-semibold">Fecha</th>
                    <th className="px-3 py-3 font-semibold">Sede</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Resultado</th>
                    {canManageMatches && <th className="px-3 py-3 font-semibold">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleMatches.map((match) => {
                    const phase = match.phaseId ? phaseById.get(match.phaseId) : undefined;
                    return (
                      <tr key={match.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-semibold">
                          {isFan && (match.status === "FINISHED" || match.status === "IN_PROGRESS") ? (
                            <>
                              {match.homeTeam}
                              <span className="mx-2 text-[#3dff7a]">
                                {match.homeScore ?? 0} - {match.awayScore ?? 0}
                              </span>
                              {match.awayTeam}
                            </>
                          ) : (
                            <>
                              {match.homeTeam} <span className="text-slate-500">vs</span> {match.awayTeam}
                            </>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-300">{phase?.name ?? "—"}</td>
                        <td className="px-3 py-3 text-slate-300">{match.roundLabel ?? "—"}</td>
                        <td className="px-3 py-3 text-slate-300">{formatDateTime(match.startsAt)}</td>
                        <td className="px-3 py-3 text-slate-300">{match.venue ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass[match.status]}`}>
                            {MATCH_STATUS_LABEL[match.status]}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {match.status === "FINISHED"
                            ? match.officialResult === "HOME"
                              ? `${match.homeTeam} gana`
                              : match.officialResult === "AWAY"
                                ? `${match.awayTeam} gana`
                                : match.officialResult === "DRAW"
                                  ? "Empate"
                                  : "Anulado"
                            : "—"}
                        </td>
                        {canManageMatches && (
                          <td className="px-3 py-3">
                            <span className="flex gap-2">
                              <IconButton
                                label={`Editar ${match.homeTeam} vs ${match.awayTeam}`}
                                tone="edit"
                                onClick={() => openEdit(match)}
                              />
                              <IconButton
                                label={`Eliminar ${match.homeTeam} vs ${match.awayTeam}`}
                                tone="delete"
                                onClick={() => void handleDelete(match)}
                              />
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleMatches.length === 0 && <EmptyNote>No hay partidos que coincidan con los filtros.</EmptyNote>}
            </div>
          </Panel>
        </>
      )}

      {modalOpen && canManageMatches && (
        <Modal title={form.id ? "Editar partido" : "Nuevo partido"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <Field label="Fase">
              <select
                value={form.phaseId}
                onChange={(event) => setForm({ ...form, phaseId: Number(event.target.value) })}
                className={fieldClass()}
              >
                <option value={0}>Sin fase</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Ronda">
              <input
                value={form.roundLabel}
                onChange={(event) => setForm({ ...form, roundLabel: event.target.value })}
                placeholder="Ej. Grupo A, Semifinal"
                className={fieldClass()}
              />
            </Field>
            <Field label="Equipo local" required error={errors.homeTeamId}>
              <select
                value={form.homeTeamId}
                onChange={(event) => setForm({ ...form, homeTeamId: Number(event.target.value) })}
                className={fieldClass(Boolean(errors.homeTeamId))}
              >
                <option value={0}>Selecciona un equipo</option>
                {registrations.map((item) => (
                  <option key={item.teamId} value={item.teamId}>{item.team.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Equipo visitante" required error={errors.awayTeamId}>
              <select
                value={form.awayTeamId}
                onChange={(event) => setForm({ ...form, awayTeamId: Number(event.target.value) })}
                className={fieldClass(Boolean(errors.awayTeamId))}
              >
                <option value={0}>Selecciona un equipo</option>
                {registrations.map((item) => (
                  <option key={item.teamId} value={item.teamId}>{item.team.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Fecha y hora" required error={errors.startsAt}>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                className={fieldClass(Boolean(errors.startsAt))}
              />
            </Field>
            <Field label="Sede">
              <input
                value={form.venue}
                onChange={(event) => setForm({ ...form, venue: event.target.value })}
                placeholder="Estadio o cancha"
                className={fieldClass()}
              />
            </Field>
            <Field label="Cuota local" error={errors.homeOdd}>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.homeOdd}
                onChange={(event) => setForm({ ...form, homeOdd: Number(event.target.value) })}
                className={fieldClass(Boolean(errors.homeOdd))}
              />
            </Field>
            <Field label="Cuota visitante" error={errors.awayOdd}>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.awayOdd}
                onChange={(event) => setForm({ ...form, awayOdd: Number(event.target.value) })}
                className={fieldClass(Boolean(errors.awayOdd))}
              />
            </Field>
            <Field label="Cuota empate" error={errors.drawOdd}>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.drawOdd}
                onChange={(event) => setForm({ ...form, drawOdd: Number(event.target.value) })}
                className={fieldClass(Boolean(errors.drawOdd))}
              />
            </Field>
            {registrations.length < 2 && (
              <p className="text-xs text-amber-200 md:col-span-2">
                El torneo necesita al menos dos equipos inscritos para programar partidos.
              </p>
            )}
            <div className="flex items-end justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={primaryButtonClass}
                disabled={registrations.length < 2}
              >
                {form.id ? "Guardar cambios" : "Programar partido"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
