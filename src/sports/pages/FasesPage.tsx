import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fieldClass, formatDate, primaryButtonClass } from "../format";
import { ChartIcon } from "../glyphs";
import type { Tournament } from "../tournamentApi";
import {
  deleteTournamentPhase,
  listTournaments,
  listTournamentPhases,
  PHASE_STATUS_LABEL,
  PHASE_TYPE_LABEL,
  phaseError,
  saveTournamentPhase,
  type TournamentPhase,
  type TournamentPhaseInput,
  type TournamentPhaseStatus,
  type TournamentPhaseType,
} from "../tournamentPhaseApi";
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

const TYPES: TournamentPhaseType[] = ["GROUPS", "KNOCKOUT"];
const STATUSES: TournamentPhaseStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED",
];

const emptyForm = (): TournamentPhaseInput => ({
  name: "",
  phaseOrder: 1,
  phaseType: "GROUPS",
  startDate: "",
  endDate: "",
  status: "PLANNED",
});

export default function FasesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TournamentPhaseInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedTournament = useMemo(
    () => tournaments.find((item) => String(item.id) === tournamentId) ?? null,
    [tournaments, tournamentId],
  );

  const reloadPhases = async (id: number) => {
    setPhases(await listTournamentPhases(id));
  };

  useEffect(() => {
    document.title = "Fases de Torneos · Sports System+";
    void (async () => {
      try {
        const items = await listTournaments();
        setTournaments(items);
        if (items.length) setTournamentId(String(items[0].id));
      } catch (error) {
        setNotice({ tone: "error", title: "No se pudieron cargar los torneos", message: phaseError(error) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setPhases([]);
      return;
    }
    void reloadPhases(Number(tournamentId)).catch((error) => {
      setNotice({ tone: "error", title: "No se pudieron cargar las fases", message: phaseError(error) });
    });
  }, [tournamentId]);

  const openCreate = () => {
    setForm({
      ...emptyForm(),
      phaseOrder: phases.length + 1,
      startDate: selectedTournament?.startDate ?? "",
      endDate: selectedTournament?.endDate ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (phase: TournamentPhase) => {
    setForm({
      id: phase.id,
      name: phase.name,
      phaseOrder: phase.phaseOrder,
      phaseType: phase.phaseType,
      startDate: phase.startDate,
      endDate: phase.endDate,
      status: phase.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTournament) return;
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Este campo es obligatorio.";
    if (!form.phaseOrder || form.phaseOrder < 1) nextErrors.phaseOrder = "El orden debe ser mayor que cero.";
    if (!form.startDate) nextErrors.startDate = "Selecciona la fecha de inicio.";
    if (!form.endDate) nextErrors.endDate = "Selecciona la fecha de finalización.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = "La fecha final debe ser posterior a la inicial.";
    }
    if (
      form.startDate &&
      form.endDate &&
      (form.startDate < selectedTournament.startDate || form.endDate > selectedTournament.endDate)
    ) {
      nextErrors.startDate = "Las fechas deben estar dentro del torneo.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await saveTournamentPhase(selectedTournament.id, form);
      setNotice({
        tone: "ok",
        message: form.id ? "Fase actualizada correctamente." : "Fase creada correctamente.",
      });
      setModalOpen(false);
      await reloadPhases(selectedTournament.id);
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo guardar", message: phaseError(error) });
    }
  };

  const handleDelete = async (phase: TournamentPhase) => {
    if (!selectedTournament) return;
    if (phase.status === "IN_PROGRESS") {
      setNotice({ tone: "error", title: "No se puede eliminar", message: "Una fase en progreso no puede eliminarse." });
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar "${phase.name}"?`)) return;
    try {
      const result = await deleteTournamentPhase(selectedTournament.id, phase.id);
      setNotice({ tone: "ok", message: result.message });
      await reloadPhases(selectedTournament.id);
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo eliminar", message: phaseError(error) });
    }
  };

  return (
    <div>
      <PageHeader
        icon={<ChartIcon />}
        title="Fases del Torneo"
        subtitle="Organiza las fases y su secuencia dentro de cada torneo"
        actions={
          selectedTournament ? (
            <button type="button" onClick={openCreate} className={primaryButtonClass}>
              + Nueva fase
            </button>
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
          <div className="mb-4">
            <select
              value={tournamentId}
              onChange={(event) => setTournamentId(event.target.value)}
              className={fieldClass()}
              aria-label="Seleccionar torneo"
            >
              {tournaments.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-semibold">Orden</th>
                    <th className="px-3 py-3 font-semibold">Fase</th>
                    <th className="px-3 py-3 font-semibold">Tipo</th>
                    <th className="px-3 py-3 font-semibold">Fechas</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((phase) => (
                    <tr key={phase.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-bold text-[#3dff7a]">{phase.phaseOrder}</td>
                      <td className="px-3 py-3 font-semibold">{phase.name}</td>
                      <td className="px-3 py-3 text-slate-300">{PHASE_TYPE_LABEL[phase.phaseType]}</td>
                      <td className="px-3 py-3 text-slate-300">
                        {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-bold text-sky-300">
                          {PHASE_STATUS_LABEL[phase.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex gap-2">
                          <IconButton label={`Editar ${phase.name}`} tone="edit" onClick={() => openEdit(phase)} />
                          <IconButton label={`Eliminar ${phase.name}`} tone="delete" onClick={() => void handleDelete(phase)} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {phases.length === 0 && <EmptyNote>No hay fases registradas.</EmptyNote>}
            </div>
          </Panel>
        </>
      )}

      {modalOpen && (
        <Modal title={form.id ? "Editar fase" : "Nueva fase"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required error={errors.name}>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass(Boolean(errors.name))} />
            </Field>
            <Field label="Orden" required error={errors.phaseOrder}>
              <input type="number" min={1} value={form.phaseOrder} onChange={(event) => setForm({ ...form, phaseOrder: Number(event.target.value) })} className={fieldClass(Boolean(errors.phaseOrder))} />
            </Field>
            <Field label="Tipo">
              <select value={form.phaseType} onChange={(event) => setForm({ ...form, phaseType: event.target.value as TournamentPhaseType })} className={fieldClass()}>
                {TYPES.map((value) => <option key={value} value={value}>{PHASE_TYPE_LABEL[value]}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TournamentPhaseStatus })} className={fieldClass()}>
                {STATUSES.map((value) => <option key={value} value={value}>{PHASE_STATUS_LABEL[value]}</option>)}
              </select>
            </Field>
            <Field label="Fecha de inicio" required error={errors.startDate}>
              <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={fieldClass(Boolean(errors.startDate))} />
            </Field>
            <Field label="Fecha de finalización" required error={errors.endDate}>
              <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={fieldClass(Boolean(errors.endDate))} />
            </Field>
            <div className="flex items-end justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">Cancelar</button>
              <button type="submit" className={primaryButtonClass}>{form.id ? "Guardar cambios" : "Crear fase"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
