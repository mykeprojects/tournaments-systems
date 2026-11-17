import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { routePaths } from "../../routes/routePaths";
import { NameLookup } from "../NameLookup";
import { useSportsCatalog } from "../SportsCatalogContext";
import { fieldClass, ghostButtonClass, primaryButtonClass } from "../format";
import { PlayerIcon } from "../glyphs";
import { DOMINANT_FEET, FLAGS, NATIONALITIES, POSITION_CLASS, POSITIONS } from "../options";
import { activeContract, parentSports } from "../selectors";
import type { Player, Status } from "../types";
import {
  Avatar,
  Crest,
  EmptyNote,
  Field,
  IconButton,
  Modal,
  NoticeBanner,
  PageHeader,
  Pager,
  Panel,
  StatusPill,
  usePaged,
  type Notice,
} from "../ui";

type PlayerForm = {
  id?: string;
  fullName: string;
  document: string;
  age: string;
  nationality: string;
  position: string;
  heightM: string;
  dominantFoot: string;
  status: Status;
  email: string;
  phone: string;
  preferredSportId: string;
  teamId: string;
};

const emptyForm = (): PlayerForm => ({
  fullName: "",
  document: "",
  age: "",
  nationality: "",
  position: "",
  heightM: "",
  dominantFoot: "",
  status: "active",
  email: "",
  phone: "",
  preferredSportId: "",
  teamId: "",
});

export default function JugadoresPage() {
  const catalog = useSportsCatalog();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | Status>("todos");
  const [teamFilter, setTeamFilter] = useState("todos");
  const [sportFilter, setSportFilter] = useState("todos");
  const [selectedId, setSelectedId] = useState(params.get("jugador") ?? "juan");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    document.title = "Gestión de Jugadores · Sports System+";
  }, []);

  const parents = parentSports(catalog.sports);
  const filtered = catalog.players.filter((player) => {
    const text = `${player.fullName} ${player.document}`.toLocaleLowerCase("es");
    const matchesQuery = text.includes(query.trim().toLocaleLowerCase("es"));
    const contract = activeContract(catalog.contracts, player.id);
    const matchesStatus = status === "todos" || player.status === status;
    const matchesTeam = teamFilter === "todos" || contract?.teamId === teamFilter;
    const matchesSport =
      sportFilter === "todos" ||
      player.preferredSportId === sportFilter ||
      catalog.sports.some(
        (sport) => sport.id === player.preferredSportId && sport.parentId === sportFilter
      );
    return matchesQuery && matchesStatus && matchesTeam && matchesSport;
  });
  const paging = usePaged(filtered, 5, `${query}|${status}|${teamFilter}|${sportFilter}`);

  const selected = catalog.players.find((player) => player.id === selectedId) ?? filtered[0] ?? null;
  const selectedContract = selected ? activeContract(catalog.contracts, selected.id) : null;
  const selectedTeam = catalog.teams.find((team) => team.id === selectedContract?.teamId) ?? null;

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (player: Player) => {
    const contract = activeContract(catalog.contracts, player.id);
    setSelectedId(player.id);
    setForm({
      id: player.id,
      fullName: player.fullName,
      document: player.document,
      age: String(player.age),
      nationality: player.nationality,
      position: player.position,
      heightM: player.heightM.toFixed(2),
      dominantFoot: player.dominantFoot,
      status: player.status,
      email: player.email,
      phone: player.phone,
      preferredSportId: player.preferredSportId,
      teamId: contract?.teamId ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Este campo es obligatorio.";
    if (!form.document.trim()) nextErrors.document = "Este campo es obligatorio.";
    if (!form.age.trim()) nextErrors.age = "Este campo es obligatorio.";
    if (!form.nationality) nextErrors.nationality = "Este campo es obligatorio.";
    if (!form.position) nextErrors.position = "Este campo es obligatorio.";
    if (!form.heightM.trim()) nextErrors.heightM = "Este campo es obligatorio.";
    if (!form.dominantFoot) nextErrors.dominantFoot = "Este campo es obligatorio.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const result = await catalog.savePlayer({
      ...form,
      age: Number(form.age),
      heightM: Number(form.heightM),
    });
    if (!result.ok) {
      const field = result.message.includes("documento")
        ? "document"
        : result.message.includes("edad")
          ? "age"
          : result.message.includes("altura")
            ? "heightM"
            : "fullName";
      setErrors({ [field]: result.message });
      return;
    }
    if (result.id) setSelectedId(result.id);
    setNotice({ tone: "ok", message: result.message });
    setModalOpen(false);
  };

  const handleDelete = async (player: Player) => {
    if (catalog.contracts.some((contract) => contract.playerId === player.id)) {
      setNotice({
        tone: "error",
        title: "No se puede eliminar",
        message: "No se puede eliminar el jugador porque tiene equipos con información deportiva asociada.",
      });
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar a ${player.fullName}?`)) {
      return;
    }
    const result = await catalog.deletePlayer(player.id);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  const toggleStatus = async (player: Player) => {
    const contract = activeContract(catalog.contracts, player.id);
    const result = await catalog.savePlayer({
      id: player.id,
      fullName: player.fullName,
      document: player.document,
      age: player.age,
      nationality: player.nationality,
      position: player.position,
      heightM: player.heightM,
      dominantFoot: player.dominantFoot,
      status: player.status === "active" ? "inactive" : "active",
      email: player.email,
      phone: player.phone,
      preferredSportId: player.preferredSportId,
      teamId: contract?.teamId ?? "",
    });
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  return (
    <div>
      <PageHeader
        icon={<PlayerIcon />}
        title="Gestión de Jugadores"
        subtitle="Administra los jugadores registrados en la plataforma."
        actions={<button type="button" onClick={openCreate} className={primaryButtonClass}>+ Nuevo jugador</button>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <NameLookup
          ariaLabel="Buscar jugador"
          placeholder="Buscar jugador"
          text={query}
          onTextChange={setQuery}
          options={catalog.players.map((player) => ({ id: player.id, label: player.fullName, hint: player.document }))}
          onPick={(id) => {
            const player = catalog.players.find((item) => item.id === id);
            if (!player) {
              return;
            }
            setQuery(player.fullName);
            setSelectedId(player.id);
          }}
        />
        <select value={status} onChange={(event) => setStatus(event.target.value as "todos" | Status)} aria-label="Filtrar por estado" className={fieldClass()}>
          <option value="todos">Estado: todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
        <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} aria-label="Filtrar por equipo" className={fieldClass()}>
          <option value="todos">Equipo: todos</option>
          {catalog.teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)} aria-label="Filtrar por deporte" className={fieldClass()}>
          <option value="todos">Deporte: todos</option>
          {parents.map((sport) => (
            <option key={sport.id} value={sport.id}>{sport.name}</option>
          ))}
        </select>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-semibold">Jugador</th>
                  <th className="px-3 py-3 font-semibold">Documento</th>
                  <th className="px-3 py-3 font-semibold">Edad</th>
                  <th className="px-3 py-3 font-semibold">Posición</th>
                  <th className="px-3 py-3 font-semibold">Equipo actual</th>
                  <th className="px-3 py-3 font-semibold">Estado</th>
                  <th className="px-3 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paging.current.map((player) => {
                  const contract = activeContract(catalog.contracts, player.id);
                  const team = catalog.teams.find((item) => item.id === contract?.teamId);
                  return (
                    <tr key={player.id} onClick={() => setSelectedId(player.id)} className={`cursor-pointer border-t border-white/5 ${selected?.id === player.id ? "bg-white/5" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-semibold">
                          <Avatar name={player.fullName} />
                          {player.fullName}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{player.document}</td>
                      <td className="px-3 py-3">{player.age}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md px-2 py-1 text-xs font-bold ${POSITION_CLASS[player.position] ?? "bg-white/10"}`}>{player.position}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{team?.name ?? "Sin equipo"}</td>
                      <td className="px-3 py-3"><StatusPill status={player.status} /></td>
                      <td className="px-3 py-3">
                        <span className="flex gap-2">
                          <IconButton label={`Ver ${player.fullName}`} tone="view" onClick={() => setSelectedId(player.id)} />
                          <IconButton label={`Editar ${player.fullName}`} tone="edit" onClick={() => openEdit(player)} />
                          <IconButton label={`Eliminar ${player.fullName}`} tone="delete" onClick={() => handleDelete(player)} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {paging.total === 0 && <EmptyNote>No hay jugadores para esta búsqueda.</EmptyNote>}
          </div>
          <Pager page={paging.page} pageCount={paging.pageCount} from={paging.from} to={paging.to} total={paging.total} onPage={paging.setPage} />
        </Panel>
        <Panel title="Detalle del jugador">
          {selected ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={selected.fullName} />
                <div>
                  <h3 className="text-lg font-black">{selected.fullName}</h3>
                  <p className="text-xs text-slate-400">{selected.position}</p>
                </div>
                {selectedTeam && <Crest name={selectedTeam.name} color={selectedTeam.color} />}
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Edad</dt><dd>{selected.age} años</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Nacionalidad</dt><dd>{FLAGS[selected.nationality] ?? ""} {selected.nationality}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Posición</dt><dd>{selected.position}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Altura</dt><dd>{selected.heightM.toFixed(2)} m</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Pie dominante</dt><dd>{selected.dominantFoot}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Estado</dt><dd><StatusPill status={selected.status} /></dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Equipo actual</dt><dd>{selectedTeam?.name ?? "Sin equipo"}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Link to={`${routePaths.sportsProfile}?jugador=${selected.id}`} className={ghostButtonClass}>Consultar</Link>
                <button type="button" onClick={() => openEdit(selected)} className={ghostButtonClass}>Editar</button>
                <button type="button" onClick={() => toggleStatus(selected)} className={ghostButtonClass}>
                  {selected.status === "active" ? "Desactivar" : "Activar"}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  ["Partidos", selected.stats.matches],
                  ["Goles", selected.stats.goals],
                  ["Asistencias", selected.stats.assists],
                  ["Rendimiento", selected.stats.rating.toFixed(2)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 px-1 py-3">
                    <p className="text-lg font-black text-[#3dff7a]">{value}</p>
                    <p className="text-[10px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyNote>Selecciona o registra un jugador.</EmptyNote>
          )}
        </Panel>
      </div>
      {modalOpen && (
        <Modal title="Registrar / Editar jugador" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" required error={errors.fullName}>
              <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className={fieldClass(Boolean(errors.fullName))} />
            </Field>
            <Field label="Documento" required error={errors.document}>
              <input value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} className={fieldClass(Boolean(errors.document))} />
            </Field>
            <Field label="Edad" required error={errors.age}>
              <input type="number" min={15} max={50} value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} className={fieldClass(Boolean(errors.age))} />
            </Field>
            <Field label="Posición" required error={errors.position}>
              <select value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className={fieldClass(Boolean(errors.position))}>
                <option value="">Selecciona</option>
                {POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
              </select>
            </Field>
            <Field label="Nacionalidad" required error={errors.nationality}>
              <select value={form.nationality} onChange={(event) => setForm({ ...form, nationality: event.target.value })} className={fieldClass(Boolean(errors.nationality))}>
                <option value="">Selecciona</option>
                {NATIONALITIES.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </Field>
            <Field label="Altura (m)" required error={errors.heightM}>
              <input type="number" min={1.4} max={2.3} step="0.01" value={form.heightM} onChange={(event) => setForm({ ...form, heightM: event.target.value })} className={fieldClass(Boolean(errors.heightM))} />
            </Field>
            <Field label="Pie dominante" required error={errors.dominantFoot}>
              <select value={form.dominantFoot} onChange={(event) => setForm({ ...form, dominantFoot: event.target.value })} className={fieldClass(Boolean(errors.dominantFoot))}>
                <option value="">Selecciona</option>
                {DOMINANT_FEET.map((foot) => <option key={foot} value={foot}>{foot}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })} className={fieldClass()}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </Field>
            <Field label="Equipo actual">
              <select value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value })} className={fieldClass()}>
                <option value="">Sin equipo</option>
                {catalog.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </Field>
            <Field label="Deporte preferido">
              <select value={form.preferredSportId} onChange={(event) => setForm({ ...form, preferredSportId: event.target.value })} className={fieldClass()}>
                <option value="">Sin definir</option>
                {catalog.sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
              </select>
            </Field>
            <Field label="Correo">
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass()} />
            </Field>
            <Field label="Teléfono">
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={fieldClass()} />
            </Field>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={() => setModalOpen(false)} className={ghostButtonClass}>Cancelar</button>
              <button type="submit" className={primaryButtonClass}>Guardar jugador</button>
            </div>
          </form>
        </Modal>
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
