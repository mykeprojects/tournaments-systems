import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fieldClass, primaryButtonClass } from "../format";
import { TeamsIcon } from "../glyphs";
import type { Tournament } from "../tournamentApi";
import {
  assignTeam,
  deleteGroup,
  groupError,
  listGroups,
  listPhases,
  listRegistrations,
  listTournaments,
  removeTeam,
  saveGroup,
  type TournamentGroup,
  type TournamentGroupInput,
  type TournamentPhase,
  type TournamentRegistration,
} from "../tournamentGroupApi";
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

const emptyForm = (): TournamentGroupInput => ({
  name: "",
  groupOrder: 1,
  maxTeams: null,
});

export default function GruposPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [groups, setGroups] = useState<TournamentGroup[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [teamIdByGroup, setTeamIdByGroup] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TournamentGroupInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedPhase = useMemo(
    () => phases.find((phase) => String(phase.id) === phaseId) ?? null,
    [phases, phaseId],
  );

  const reloadGroups = async (selectedTournamentId: number, selectedPhaseId: number) => {
    setGroups(await listGroups(selectedTournamentId, selectedPhaseId));
  };

  useEffect(() => {
    document.title = "Grupos de Competencia · Sports System+";
    void (async () => {
      try {
        const items = await listTournaments();
        setTournaments(items);
        if (items.length) setTournamentId(String(items[0].id));
      } catch (error) {
        setNotice({ tone: "error", title: "No se pudieron cargar los torneos", message: groupError(error) });
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
        setRegistrations(await listRegistrations(Number(tournamentId)));
        const groupPhase = items.find((phase) => phase.phaseType === "GROUPS");
        setPhaseId(groupPhase ? String(groupPhase.id) : "");
      } catch (error) {
        setNotice({ tone: "error", title: "No se pudieron cargar las fases", message: groupError(error) });
      }
    })();
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId || !phaseId) {
      setGroups([]);
      return;
    }
    void reloadGroups(Number(tournamentId), Number(phaseId)).catch((error) => {
      setNotice({ tone: "error", title: "No se pudieron cargar los grupos", message: groupError(error) });
    });
  }, [tournamentId, phaseId]);

  const openCreate = () => {
    setForm({ ...emptyForm(), groupOrder: groups.length + 1 });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (group: TournamentGroup) => {
    setForm({
      id: group.id,
      name: group.name,
      groupOrder: group.groupOrder,
      maxTeams: group.maxTeams,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tournamentId || !phaseId) return;
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Este campo es obligatorio.";
    if (!form.groupOrder || form.groupOrder < 1) nextErrors.groupOrder = "El orden debe ser mayor que cero.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await saveGroup(Number(tournamentId), Number(phaseId), form);
      setNotice({ tone: "ok", message: form.id ? "Grupo actualizado correctamente." : "Grupo creado correctamente." });
      setModalOpen(false);
      await reloadGroups(Number(tournamentId), Number(phaseId));
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo guardar", message: groupError(error) });
    }
  };

  const handleDelete = async (group: TournamentGroup) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${group.name}"?`)) return;
    try {
      const result = await deleteGroup(Number(tournamentId), Number(phaseId), group.id);
      setNotice({ tone: "ok", message: result.message });
      await reloadGroups(Number(tournamentId), Number(phaseId));
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo eliminar", message: groupError(error) });
    }
  };

  const handleAssign = async (group: TournamentGroup) => {
    const teamId = Number(teamIdByGroup[group.id]);
    if (!teamId) return;
    try {
      const result = await assignTeam(Number(tournamentId), Number(phaseId), group.id, teamId);
      setNotice({ tone: "ok", message: result.message });
      setTeamIdByGroup((current) => ({ ...current, [group.id]: "" }));
      await reloadGroups(Number(tournamentId), Number(phaseId));
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo asignar", message: groupError(error) });
    }
  };

  const handleRemoveTeam = async (group: TournamentGroup, teamId: number) => {
    try {
      const result = await removeTeam(Number(tournamentId), Number(phaseId), group.id, teamId);
      setNotice({ tone: "ok", message: result.message });
      await reloadGroups(Number(tournamentId), Number(phaseId));
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo retirar", message: groupError(error) });
    }
  };

  const availableTeams = (group: TournamentGroup) =>
    registrations.filter(
      (registration) =>
        !group.teams.some((team) => team.id === registration.teamId),
    );

  return (
    <div>
      <PageHeader
        icon={<TeamsIcon />}
        title="Grupos de Competencia"
        subtitle="Organiza los equipos inscritos dentro de las fases de grupos"
        actions={
          selectedPhase?.phaseType === "GROUPS" ? (
            <button type="button" onClick={openCreate} className={primaryButtonClass}>+ Nuevo grupo</button>
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
            <select value={phaseId} onChange={(event) => setPhaseId(event.target.value)} className={fieldClass()} aria-label="Seleccionar fase">
              <option value="">Seleccionar fase de grupos</option>
              {phases.filter((phase) => phase.phaseType === "GROUPS").map((phase) => (
                <option key={phase.id} value={phase.id}>{phase.name}</option>
              ))}
            </select>
          </div>

          {selectedPhase?.phaseType !== "GROUPS" ? (
            <EmptyNote>Selecciona una fase de tipo grupos.</EmptyNote>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {groups.map((group) => (
                <Panel key={group.id} title={`${group.name} · Orden ${group.groupOrder}`}>
                  <div className="px-4 py-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-400">
                        {group.teams.length} equipos
                        {group.maxTeams ? ` / máximo ${group.maxTeams}` : ""}
                      </p>
                      <span className="flex gap-2">
                        <IconButton label={`Editar ${group.name}`} tone="edit" onClick={() => openEdit(group)} />
                        <IconButton label={`Eliminar ${group.name}`} tone="delete" onClick={() => void handleDelete(group)} />
                      </span>
                    </div>
                    {group.teams.length === 0 ? (
                      <EmptyNote>No hay equipos asignados.</EmptyNote>
                    ) : (
                      <ul className="space-y-2">
                        {group.teams.map((team) => (
                          <li key={team.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                            <span>
                              <span className="block text-sm font-bold">{team.name}</span>
                              <span className="text-xs text-slate-400">{team.city}</span>
                            </span>
                            <button type="button" onClick={() => void handleRemoveTeam(group, team.id)} className="text-xs font-bold text-red-300">Retirar</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                      <select
                        value={teamIdByGroup[group.id] ?? ""}
                        onChange={(event) => setTeamIdByGroup((current) => ({ ...current, [group.id]: event.target.value }))}
                        className={fieldClass()}
                        aria-label={`Seleccionar equipo para ${group.name}`}
                      >
                        <option value="">Seleccionar equipo inscrito</option>
                        {availableTeams(group).map((registration) => (
                          <option key={registration.teamId} value={registration.teamId}>{registration.team.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => void handleAssign(group)} className={primaryButtonClass}>Asignar</button>
                    </div>
                  </div>
                </Panel>
              ))}
              {groups.length === 0 && <EmptyNote>No hay grupos registrados en esta fase.</EmptyNote>}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <Modal title={form.id ? "Editar grupo" : "Nuevo grupo"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required error={errors.name}>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass(Boolean(errors.name))} />
            </Field>
            <Field label="Orden" required error={errors.groupOrder}>
              <input type="number" min={1} value={form.groupOrder} onChange={(event) => setForm({ ...form, groupOrder: Number(event.target.value) })} className={fieldClass(Boolean(errors.groupOrder))} />
            </Field>
            <Field label="Máximo de equipos">
              <input type="number" min={2} value={form.maxTeams ?? ""} onChange={(event) => setForm({ ...form, maxTeams: event.target.value ? Number(event.target.value) : null })} className={fieldClass()} />
            </Field>
            <div className="flex items-end justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">Cancelar</button>
              <button type="submit" className={primaryButtonClass}>{form.id ? "Guardar cambios" : "Crear grupo"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
