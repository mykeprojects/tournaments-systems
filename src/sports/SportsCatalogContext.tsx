import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ActionResult,
  AssignContractInput,
  PlayerInput,
  SkillInput,
  SportInput,
  TeamInput,
} from "./catalogActions";
import { catalogRequests, createdId, loadCatalog, readSportError } from "./sportApi";
import type { CatalogData } from "./types";

type CatalogApi = CatalogData & {
  saveSport: (input: SportInput) => Promise<ActionResult>;
  deleteSport: (id: string) => Promise<ActionResult>;
  saveTeam: (input: TeamInput) => Promise<ActionResult>;
  deleteTeam: (id: string) => Promise<ActionResult>;
  associateSport: (teamId: string, sportId: string) => Promise<ActionResult>;
  removeSportAssociation: (teamId: string, sportId: string) => Promise<ActionResult>;
  savePlayer: (input: PlayerInput) => Promise<ActionResult>;
  deletePlayer: (id: string) => Promise<ActionResult>;
  assignContract: (input: AssignContractInput) => Promise<ActionResult>;
  updateContract: (contractId: string, startDate: string, endDate: string) => Promise<ActionResult>;
  releasePlayer: (contractId: string, reason: string, detail: string) => Promise<ActionResult>;
  saveSkill: (input: SkillInput) => Promise<ActionResult>;
  deleteSkill: (id: string) => Promise<ActionResult>;
  assignSkill: (playerId: string, skillId: string) => Promise<ActionResult>;
  removePlayerSkill: (playerId: string, skillId: string) => Promise<ActionResult>;
};

const CatalogContext = createContext<CatalogApi | null>(null);

const emptyCatalog = (): CatalogData => ({
  sports: [],
  teams: [],
  teamSports: [],
  players: [],
  contracts: [],
  skills: [],
  playerSkills: [],
});

export function SportsCatalogProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CatalogData>(emptyCatalog);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const next = await loadCatalog();
    setData(next);
    setLoadError(null);
    setReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    loadCatalog()
      .then((next) => {
        if (!active) return;
        setData(next);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(readSportError(error));
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const run = useCallback(
    async (request: () => Promise<{ data: { message: string } }>): Promise<ActionResult> => {
      try {
        const response = await request();
        try {
          await reload();
        } catch {
          setLoadError("El cambio se guardó, pero no se pudo actualizar la lista.");
        }
        return { ok: true, message: response.data.message, id: createdId(response.data) };
      } catch (error) {
        return { ok: false, message: readSportError(error) };
      }
    },
    [reload]
  );

  const api = useMemo<Omit<CatalogApi, keyof CatalogData>>(
    () => ({
      saveSport: (input) => run(() => catalogRequests.saveSport(input)),
      deleteSport: (id) => run(() => catalogRequests.deleteSport(id)),
      saveTeam: (input) => run(() => catalogRequests.saveTeam(input)),
      deleteTeam: (id) => run(() => catalogRequests.deleteTeam(id)),
      associateSport: (teamId, sportId) => run(() => catalogRequests.associateSport(teamId, sportId)),
      removeSportAssociation: (teamId, sportId) => run(() => catalogRequests.removeSportAssociation(teamId, sportId)),
      savePlayer: (input) => run(() => catalogRequests.savePlayer(input)),
      deletePlayer: (id) => run(() => catalogRequests.deletePlayer(id)),
      assignContract: (input) => run(() => catalogRequests.assignContract(input)),
      updateContract: (contractId, startDate, endDate) =>
        run(() => catalogRequests.updateContract(contractId, startDate, endDate)),
      releasePlayer: (contractId, reason, detail) =>
        run(() => catalogRequests.releasePlayer(contractId, reason, detail)),
      saveSkill: (input) => run(() => catalogRequests.saveSkill(input)),
      deleteSkill: (id) => run(() => catalogRequests.deleteSkill(id)),
      assignSkill: (playerId, skillId) => run(() => catalogRequests.assignSkill(playerId, skillId)),
      removePlayerSkill: (playerId, skillId) => run(() => catalogRequests.removePlayerSkill(playerId, skillId)),
    }),
    [run]
  );

  const value = useMemo<CatalogApi>(() => ({ ...data, ...api }), [api, data]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-200">
        Cargando el catálogo deportivo…
      </div>
    );
  }

  return (
    <CatalogContext.Provider value={value}>
      {loadError ? (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-300/60 bg-[#2a1c06] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-lg font-black text-amber-200" aria-hidden="true">
              !
            </span>
            <p className="text-sm font-semibold leading-6 text-amber-50">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => void reload().catch((error: unknown) => setLoadError(readSportError(error)))}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-amber-300/50 px-4 py-2 text-sm font-bold text-amber-50 transition hover:bg-amber-300/15"
          >
            Reintentar
          </button>
        </div>
      ) : null}
      {children}
    </CatalogContext.Provider>
  );
}

export function useSportsCatalog(): CatalogApi {
  const catalog = useContext(CatalogContext);
  if (!catalog) {
    throw new Error("useSportsCatalog debe usarse dentro de SportsCatalogProvider.");
  }
  return catalog;
}
