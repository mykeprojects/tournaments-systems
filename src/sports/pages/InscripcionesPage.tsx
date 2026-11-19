import { useEffect, useMemo, useState } from "react";
import { fieldClass, primaryButtonClass } from "../format";
import { TeamsIcon } from "../glyphs";
import { useSportsCatalog } from "../SportsCatalogContext";
import type { Tournament } from "../tournamentApi";
import {
  listRegistrations,
  listTournaments,
  registerTeam,
  registrationError,
  withdrawTeam,
  type TournamentRegistration,
} from "../tournamentRegistrationApi";
import {
  EmptyNote,
  NoticeBanner,
  PageHeader,
  Panel,
  type Notice,
} from "../ui";

export default function InscripcionesPage() {
  const catalog = useSportsCatalog();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedTournament = tournaments.find((item) => String(item.id) === tournamentId) ?? null;

  const reloadRegistrations = async (id: number) => {
    setRegistrations(await listRegistrations(id));
  };

  useEffect(() => {
    document.title = "Inscripciones · Sports System+";
    void (async () => {
      try {
        const items = await listTournaments();
        setTournaments(items);
        if (items.length) setTournamentId(String(items[0].id));
      } catch (error) {
        setNotice({ tone: "error", title: "No se pudieron cargar los torneos", message: registrationError(error) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setRegistrations([]);
      return;
    }
    void reloadRegistrations(Number(tournamentId)).catch((error) => {
      setNotice({ tone: "error", title: "No se pudieron cargar las inscripciones", message: registrationError(error) });
    });
  }, [tournamentId]);

  const compatibleTeams = useMemo(() => {
    if (!selectedTournament) return [];
    const acceptedSportIds = new Set<string>();
    const tournamentSport = catalog.sports.find((sport) => Number(sport.id) === selectedTournament.sportId);
    if (!tournamentSport) return [];

    acceptedSportIds.add(String(tournamentSport.id));
    if (tournamentSport.parentId == null) {
      catalog.sports
        .filter((sport) => sport.parentId === tournamentSport.id)
        .forEach((sport) => acceptedSportIds.add(sport.id));
    }

    return catalog.teams.filter((team) =>
      catalog.teamSports.some(
        (link) => link.teamId === team.id && acceptedSportIds.has(link.sportId),
      ),
    );
  }, [catalog.sports, catalog.teamSports, catalog.teams, selectedTournament]);

  const handleRegister = async () => {
    if (!selectedTournament || !teamId) return;
    try {
      const result = await registerTeam(selectedTournament.id, Number(teamId));
      setNotice({ tone: "ok", message: result.message });
      setTeamId("");
      await reloadRegistrations(selectedTournament.id);
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo inscribir", message: registrationError(error) });
    }
  };

  const handleWithdraw = async (teamIdToRemove: number) => {
    if (!selectedTournament) return;
    if (!window.confirm("¿Seguro que deseas retirar este equipo del torneo?")) return;
    try {
      const result = await withdrawTeam(selectedTournament.id, teamIdToRemove);
      setNotice({ tone: "ok", message: result.message });
      await reloadRegistrations(selectedTournament.id);
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo retirar", message: registrationError(error) });
    }
  };

  const availableTeams = compatibleTeams.filter(
    (team) => !registrations.some((registration) => registration.teamId === Number(team.id)),
  );

  return (
    <div>
      <PageHeader
        icon={<TeamsIcon />}
        title="Inscripciones"
        subtitle="Inscribe equipos compatibles en los torneos"
      />
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      {loading ? (
        <EmptyNote>Cargando torneos…</EmptyNote>
      ) : tournaments.length === 0 ? (
        <EmptyNote>No hay torneos registrados.</EmptyNote>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className={fieldClass()}
              aria-label="Seleccionar equipo"
            >
              <option value="">Seleccionar equipo</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => void handleRegister()} className={primaryButtonClass}>
              Inscribir equipo
            </button>
          </div>

          <Panel title="Equipos inscritos" extra={<span className="text-xs text-slate-400">{registrations.length} inscritos</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-semibold">Equipo</th>
                    <th className="px-3 py-3 font-semibold">Ciudad</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-t border-white/5">
                      <td className="px-4 py-3 font-semibold">{registration.team.name}</td>
                      <td className="px-3 py-3 text-slate-300">{registration.team.city}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                          Inscrito
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => void handleWithdraw(registration.teamId)}
                          className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-bold text-red-300"
                        >
                          Retirar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {registrations.length === 0 && <EmptyNote>No hay equipos inscritos.</EmptyNote>}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
