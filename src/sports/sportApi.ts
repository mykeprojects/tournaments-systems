import axios from "axios";
import { getAuthToken } from "../storage/authSession";
import type {
  AssignContractInput,
  PlayerInput,
  SkillInput,
  SportInput,
  TeamInput,
} from "./catalogActions";
import type { CatalogData, Contract, PlayerSkill, Skill, SkillGlyph, Status, TeamSport } from "./types";

const GLYPHS = new Set<SkillGlyph>(["run", "ball", "target", "heart", "pass", "shield", "eye", "crown"]);

type RemoteSport = {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  status: Status;
  parentId: number | null;
  createdAt: string;
};

type RemoteTeam = {
  id: number;
  code: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
  createdAt: string;
  color: string;
  sports: { id: number }[];
};

type RemotePlayer = {
  id: number;
  fullName: string;
  document: string;
  age: number;
  nationality: string;
  position: string;
  heightM: number;
  dominantFoot: string;
  status: Status;
  email: string;
  phone: string;
  preferredSportId: number | null;
  stats: CatalogData["players"][number]["stats"];
};

type RemoteContract = {
  id: number;
  playerId: number;
  teamId: number;
  startDate: string;
  endDate: string;
  status: Contract["status"];
  endReason: string | null;
  detail: string | null;
};

type RemoteSkill = {
  id: number;
  name: string;
  category: Skill["category"];
  description: string;
  glyph: string;
};

type MutationBody = {
  message: string;
  sport?: { id: number };
  team?: { id: number };
  player?: { id: number };
  skill?: { id: number };
};

export const sportClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

sportClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

const textId = (value: number | null | undefined): string => (value == null ? "" : String(value));

const numberId = (value: string | null | undefined): number | null => {
  if (value == null || value === "") return null;
  return Number(value);
};

const glyphOf = (value: string): SkillGlyph => (GLYPHS.has(value as SkillGlyph) ? (value as SkillGlyph) : "target");

export function readSportError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida para el servicio deportivo.";
    if (error.response.status === 403) return "No tienes permiso para esta operación.";
    if (error.response.status === 503) return "El servicio de seguridad no está disponible.";
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  }
  return "No fue posible completar la operación.";
}

export function createdId(body: MutationBody): string | undefined {
  const id = body.sport?.id ?? body.team?.id ?? body.player?.id ?? body.skill?.id;
  return id == null ? undefined : String(id);
}

export async function loadCatalog(): Promise<CatalogData> {
  const [sports, teams, players, skills] = await Promise.all([
    sportClient.get<RemoteSport[]>("/sports"),
    sportClient.get<RemoteTeam[]>("/teams"),
    sportClient.get<RemotePlayer[]>("/players"),
    sportClient.get<RemoteSkill[]>("/skills"),
  ]);
  const [rosters, profiles] = await Promise.all([
    Promise.all(
      teams.data.map((team) =>
        sportClient.get<{ actuales: RemoteContract[]; historial: RemoteContract[] }>(`/teams/${team.id}/roster`)
      )
    ),
    Promise.all(
      players.data.map((player) =>
        sportClient.get<{ skills: { id: number; score: number }[] }>(`/players/${player.id}/profile`)
      )
    ),
  ]);

  const contracts = new Map<string, Contract>();
  for (const roster of rosters) {
    for (const contract of [...roster.data.actuales, ...roster.data.historial]) {
      contracts.set(String(contract.id), {
        id: String(contract.id),
        playerId: String(contract.playerId),
        teamId: String(contract.teamId),
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        endReason: contract.endReason,
        detail: contract.detail,
      });
    }
  }

  const teamSports: TeamSport[] = teams.data.flatMap((team) =>
    team.sports.map((sport) => ({ teamId: String(team.id), sportId: String(sport.id) }))
  );
  const playerSkills: PlayerSkill[] = players.data.flatMap((player, index) =>
    profiles[index].data.skills.map((skill) => ({
      playerId: String(player.id),
      skillId: String(skill.id),
      score: skill.score,
    }))
  );

  return {
    sports: sports.data.map((sport) => ({
      id: String(sport.id),
      code: sport.code,
      name: sport.name,
      category: sport.category,
      description: sport.description,
      status: sport.status,
      parentId: sport.parentId == null ? null : String(sport.parentId),
      createdAt: sport.createdAt,
    })),
    teams: teams.data.map((team) => ({
      id: String(team.id),
      code: team.code,
      name: team.name,
      shortName: team.shortName,
      city: team.city,
      description: team.description,
      status: team.status,
      createdAt: team.createdAt,
      color: team.color,
    })),
    teamSports,
    players: players.data.map((player) => ({
      id: String(player.id),
      fullName: player.fullName,
      document: player.document,
      age: Number(player.age),
      nationality: player.nationality,
      position: player.position,
      heightM: Number(player.heightM),
      dominantFoot: player.dominantFoot,
      status: player.status,
      email: player.email,
      phone: player.phone,
      preferredSportId: textId(player.preferredSportId),
      stats: {
        matches: Number(player.stats.matches),
        goals: Number(player.stats.goals),
        assists: Number(player.stats.assists),
        rating: Number(player.stats.rating),
      },
    })),
    contracts: [...contracts.values()],
    skills: skills.data.map((skill) => ({
      id: String(skill.id),
      name: skill.name,
      category: skill.category,
      description: skill.description,
      glyph: glyphOf(skill.glyph),
    })),
    playerSkills,
  };
}

const sportBody = (input: SportInput) => ({
  name: input.name,
  category: input.category,
  description: input.description,
  status: input.status,
  subsports: input.subsports,
});

const teamBody = (input: TeamInput) => ({
  name: input.name,
  shortName: input.shortName,
  city: input.city,
  description: input.description,
  status: input.status,
});

const playerBody = (input: PlayerInput) => ({
  fullName: input.fullName,
  document: input.document,
  age: input.age,
  nationality: input.nationality,
  position: input.position,
  heightM: input.heightM,
  dominantFoot: input.dominantFoot,
  status: input.status,
  email: input.email,
  phone: input.phone,
  preferredSportId: numberId(input.preferredSportId),
  teamId: numberId(input.teamId),
});

const skillBody = (input: SkillInput) => ({
  name: input.name,
  category: input.category,
  description: input.description,
  ...(input.glyph ? { glyph: input.glyph } : {}),
});

export const catalogRequests = {
  saveSport: (input: SportInput) =>
    input.id
      ? sportClient.patch<MutationBody>(`/sports/${input.id}`, sportBody(input))
      : sportClient.post<MutationBody>("/sports", sportBody(input)),
  deleteSport: (id: string) => sportClient.delete<MutationBody>(`/sports/${id}`),
  saveTeam: (input: TeamInput) =>
    input.id
      ? sportClient.patch<MutationBody>(`/teams/${input.id}`, teamBody(input))
      : sportClient.post<MutationBody>("/teams", teamBody(input)),
  deleteTeam: (id: string) => sportClient.delete<MutationBody>(`/teams/${id}`),
  associateSport: (teamId: string, sportId: string) =>
    sportClient.post<MutationBody>(`/teams/${teamId}/sports`, { sportId: Number(sportId) }),
  removeSportAssociation: (teamId: string, sportId: string) =>
    sportClient.delete<MutationBody>(`/teams/${teamId}/sports/${sportId}`),
  savePlayer: (input: PlayerInput) =>
    input.id
      ? sportClient.patch<MutationBody>(`/players/${input.id}`, playerBody(input))
      : sportClient.post<MutationBody>("/players", playerBody(input)),
  deletePlayer: (id: string) => sportClient.delete<MutationBody>(`/players/${id}`),
  assignContract: (input: AssignContractInput) =>
    sportClient.post<MutationBody>(`/teams/${input.teamId}/players`, {
      playerId: Number(input.playerId),
      startDate: input.startDate,
      endDate: input.endDate,
    }),
  updateContract: (contractId: string, startDate: string, endDate: string) =>
    sportClient.patch<MutationBody>(`/contracts/${contractId}`, { startDate, endDate }),
  releasePlayer: (contractId: string, reason: string, detail: string) =>
    sportClient.post<MutationBody>(`/contracts/${contractId}/release`, { reason, detail }),
  saveSkill: (input: SkillInput) =>
    input.id
      ? sportClient.patch<MutationBody>(`/skills/${input.id}`, skillBody(input))
      : sportClient.post<MutationBody>("/skills", skillBody(input)),
  deleteSkill: (id: string) => sportClient.delete<MutationBody>(`/skills/${id}`),
  assignSkill: (playerId: string, skillId: string) =>
    sportClient.post<MutationBody>(`/players/${playerId}/skills`, { skillId: Number(skillId) }),
  removePlayerSkill: (playerId: string, skillId: string) =>
    sportClient.delete<MutationBody>(`/players/${playerId}/skills/${skillId}`),
};
