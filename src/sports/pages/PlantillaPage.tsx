import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { routePaths } from "../../routes/routePaths";
import { NameLookup } from "../NameLookup";
import { useSportsCatalog } from "../SportsCatalogContext";
import { addYears, fieldClass, formatDate, ghostButtonClass, primaryButtonClass, todayIso } from "../format";
import { TeamsIcon } from "../glyphs";
import { POSITION_CLASS } from "../options";
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
import type { Contract } from "../types";

export default function PlantillaPage() {
  const catalog = useSportsCatalog();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [assignOpen, setAssignOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(addYears(todayIso(), 1));
  const [formError, setFormError] = useState("");
  const [editing, setEditing] = useState<Contract | null>(null);
  const [releasing, setReleasing] = useState<Contract | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [teamQuery, setTeamQuery] = useState<string | null>(null);
  const [playerQuery, setPlayerQuery] = useState("");
  const team = catalog.teams.find((item) => item.id === params.get("equipo")) ?? catalog.teams[0] ?? null;

  useEffect(() => {
    document.title = "Plantilla del equipo · Sports System+";
  }, []);

  const currentContracts = catalog.contracts.filter(
    (contract) => contract.teamId === team?.id && contract.status === "active"
  );
  const history = catalog.contracts
    .filter((contract) => contract.teamId === team?.id && contract.status === "finished")
    .slice()
    .sort((left, right) => right.endDate.localeCompare(left.endDate));
  const currentPage = usePaged(currentContracts, 5);
  const historyPage = usePaged(history, 5);
  const ages = currentContracts
    .map((contract) => catalog.players.find((player) => player.id === contract.playerId)?.age)
    .filter((age): age is number => typeof age === "number");
  const averageAge = ages.length ? (ages.reduce((total, age) => total + age, 0) / ages.length).toFixed(1) : "0";

  const selectTeam = (teamId: string) => {
    const next = new URLSearchParams(params);
    next.set("equipo", teamId);
    setParams(next);
  };

  const submitAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!team) {
      return;
    }
    if (!playerId) {
      setFormError("Selecciona un jugador.");
      return;
    }
    const result = await catalog.assignContract({ playerId, teamId: team.id, startDate, endDate });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setNotice({ tone: "ok", message: result.message });
    setAssignOpen(false);
    setFormError("");
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) {
      return;
    }
    const result = await catalog.updateContract(editing.id, startDate, endDate);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
    if (result.ok) {
      setEditing(null);
    }
  };

  const confirmRelease = async () => {
    if (!releasing) {
      return;
    }
    const result = await catalog.releasePlayer(
      releasing.id,
      "Transferido",
      "El jugador dejó la plantilla actual y su vinculación quedó en el historial."
    );
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
    setReleasing(null);
  };

  return (
    <div>
      <PageHeader
        icon={<TeamsIcon />}
        title="Plantilla del Equipo"
        subtitle="Gestiona la plantilla actual y el historial de jugadores del equipo."
        actions={
          <button
            type="button"
            onClick={() => {
              setPlayerId("");
              setPlayerQuery("");
              setStartDate(todayIso());
              setEndDate(addYears(todayIso(), 1));
              setFormError("");
              setAssignOpen(true);
            }}
            className={primaryButtonClass}
            disabled={!team}
          >
            + Asignar jugador
          </button>
        }
      />
      {!team ? (
        <EmptyNote>Registra un equipo para gestionar su plantilla.</EmptyNote>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="block max-w-md text-sm font-semibold">
              Equipo
              <NameLookup
                ariaLabel="Buscar equipo"
                placeholder="Buscar equipo"
                text={teamQuery ?? team.name}
                onTextChange={setTeamQuery}
                options={catalog.teams.map((item) => ({ id: item.id, label: item.name, hint: item.city }))}
                onPick={(id) => {
                  selectTeam(id);
                  setTeamQuery(null);
                }}
              />
            </div>
            <Panel title="Jugadores actuales">
              <ContractTable
                contracts={currentPage.current}
                players={catalog.players}
                onView={(contract) => navigate(`${routePaths.sportsProfile}?jugador=${contract.playerId}`)}
                onEdit={(contract) => {
                  setEditing(contract);
                  setStartDate(contract.startDate);
                  setEndDate(contract.endDate);
                }}
                onRemove={setReleasing}
              />
              {currentPage.total === 0 && <EmptyNote>Este equipo no tiene jugadores en la plantilla actual.</EmptyNote>}
              <Pager page={currentPage.page} pageCount={currentPage.pageCount} from={currentPage.from} to={currentPage.to} total={currentPage.total} onPage={currentPage.setPage} />
            </Panel>
            <Panel title="Historial de jugadores">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-semibold">Jugador</th>
                      <th className="px-3 py-3 font-semibold">Periodo</th>
                      <th className="px-3 py-3 font-semibold">Fecha fin</th>
                      <th className="px-3 py-3 font-semibold">Motivo</th>
                      <th className="px-3 py-3 font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPage.current.map((contract) => {
                      const player = catalog.players.find((item) => item.id === contract.playerId);
                      return (
                        <tr key={contract.id} className="border-t border-white/5">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <Avatar name={player?.fullName ?? "Jugador"} />
                              {player?.fullName ?? "Jugador"}
                            </span>
                          </td>
                          <td className="px-3 py-3">{contract.startDate.slice(0, 4)} - {contract.endDate.slice(0, 4)}</td>
                          <td className="px-3 py-3">{formatDate(contract.endDate)}</td>
                          <td className="px-3 py-3 text-amber-200">{contract.endReason}</td>
                          <td className="px-3 py-3 text-slate-300">{contract.detail}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {historyPage.total === 0 && <EmptyNote>Este equipo todavía no tiene historial de traspasos.</EmptyNote>}
              </div>
              <Pager page={historyPage.page} pageCount={historyPage.pageCount} from={historyPage.from} to={historyPage.to} total={historyPage.total} onPage={historyPage.setPage} />
            </Panel>
          </div>
          <Panel title="Detalle del equipo">
            <div className="space-y-4 p-4 text-sm">
              <div className="text-center">
                <Crest name={team.name} color={team.color} large />
                <h3 className="mt-3 text-lg font-black">{team.name}</h3>
                <p className="text-slate-400">{team.city}</p>
              </div>
              <p className="leading-6 text-slate-300">{team.description}</p>
              <dl className="space-y-2">
                <div className="flex justify-between"><dt className="text-slate-500">Fecha de creación</dt><dd>{formatDate(team.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Jugadores en plantilla</dt><dd>{currentContracts.length}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Contratos activos</dt><dd>{currentContracts.length}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Promedio de edad</dt><dd>{averageAge} años</dd></div>
              </dl>
              <Link to={`${routePaths.sportsTeams}?equipo=${team.id}`} className={ghostButtonClass}>Ver perfil del equipo</Link>
            </div>
          </Panel>
        </div>
      )}
      {assignOpen && team && (
        <Modal title="Asignar jugador al equipo" onClose={() => setAssignOpen(false)}>
          <form onSubmit={submitAssign} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold text-slate-300">
                Seleccionar jugador <span className="text-red-400">*</span>
                <NameLookup
                  ariaLabel="Buscar jugador"
                  placeholder="Buscar y seleccionar jugador..."
                  text={playerQuery}
                  invalid={Boolean(formError)}
                  onTextChange={(value) => {
                    setPlayerQuery(value);
                    const match = catalog.players.find((player) => player.fullName === value);
                    setPlayerId(match?.id ?? "");
                    setFormError("");
                  }}
                  options={catalog.players.map((player) => ({ id: player.id, label: player.fullName, hint: player.position }))}
                  onPick={(id) => {
                    const player = catalog.players.find((item) => item.id === id);
                    setPlayerId(id);
                    setPlayerQuery(player?.fullName ?? "");
                    setFormError("");
                  }}
                />
                {formError && <span className="mt-1 block font-medium text-red-400">{formError}</span>}
              </div>
            </div>
            <Field label="Fecha inicio del contrato" required>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldClass()} required />
            </Field>
            <Field label="Fecha fin del contrato" required>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={fieldClass()} required />
            </Field>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={() => setAssignOpen(false)} className={ghostButtonClass}>Cancelar</button>
              <button type="submit" className={primaryButtonClass}>Asignar</button>
            </div>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal title="Editar vinculación" onClose={() => setEditing(null)}>
          <form onSubmit={submitEdit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha inicio del contrato" required>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldClass()} required />
            </Field>
            <Field label="Fecha fin del contrato" required>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={fieldClass()} required />
            </Field>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={() => setEditing(null)} className={ghostButtonClass}>Cancelar</button>
              <button type="submit" className={primaryButtonClass}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
      {releasing && (
        <Modal title="Retirar de la plantilla" onClose={() => setReleasing(null)}>
          <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            El jugador dejará de pertenecer a la plantilla actual, pero su vinculación permanecerá registrada en el historial.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setReleasing(null)} className={ghostButtonClass}>Cancelar</button>
            <button type="button" onClick={confirmRelease} className={primaryButtonClass}>Retirar</button>
          </div>
        </Modal>
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

function ContractTable({
  contracts,
  players,
  onView,
  onEdit,
  onRemove,
}: {
  contracts: Contract[];
  players: { id: string; fullName: string; position: string }[];
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onRemove: (contract: Contract) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-semibold">Jugador</th>
            <th className="px-3 py-3 font-semibold">Posición</th>
            <th className="px-3 py-3 font-semibold">Fecha inicio</th>
            <th className="px-3 py-3 font-semibold">Fecha fin</th>
            <th className="px-3 py-3 font-semibold">Estado del contrato</th>
            <th className="px-3 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => {
            const player = players.find((item) => item.id === contract.playerId);
            return (
              <tr key={contract.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <Avatar name={player?.fullName ?? "Jugador"} />
                    {player?.fullName}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-md px-2 py-1 text-xs font-bold ${POSITION_CLASS[player?.position ?? ""] ?? "bg-white/10"}`}>{player?.position}</span>
                </td>
                <td className="px-3 py-3">{formatDate(contract.startDate)}</td>
                <td className="px-3 py-3">{formatDate(contract.endDate)}</td>
                <td className="px-3 py-3"><StatusPill status="active" /></td>
                <td className="px-3 py-3">
                  <span className="flex gap-2">
                    <IconButton label="Ver perfil" tone="view" onClick={() => onView(contract)} />
                    <IconButton label="Editar contrato" tone="edit" onClick={() => onEdit(contract)} />
                    <IconButton label="Retirar de la plantilla" tone="delete" onClick={() => onRemove(contract)} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
