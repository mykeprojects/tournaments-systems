import axios from "axios";
import { getAuthToken } from "../storage/authSession";

export type StandingTeam = {
  id: number;
  name: string;
  shortName?: string | null;
  code?: string | null;
};

export type StandingRow = {
  position: number;
  team: StandingTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type GroupStandings = {
  id: number;
  name: string;
  groupOrder: number;
  maxTeams: number | null;
  standings: StandingRow[];
};

export type KnockoutMatch = {
  id: number;
  status: string;
  officialResult: "HOME" | "AWAY" | "DRAW" | "VOID" | null;
  startsAt: string;
  homeTeamId: number;
  awayTeamId: number;
} | null;

export type KnockoutMatchup = {
  bracketId: number;
  bracketOrder: number;
  roundType: "QUARTERFINAL" | "SEMIFINAL" | "FINAL";
  status: string;
  teamA: StandingTeam | null;
  teamB: StandingTeam | null;
  winnerTeam: StandingTeam | null;
  nextMatchup: null;
  match: KnockoutMatch;
};

export type KnockoutRound = {
  roundType: "QUARTERFINAL" | "SEMIFINAL" | "FINAL";
  label: string;
  matchups: KnockoutMatchup[];
};

export type DevelopmentPhase = {
  id: number;
  tournamentId: number;
  name: string;
  phaseOrder: number;
  phaseType: "GROUPS" | "KNOCKOUT";
  status: "PLANNED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  startDate: string;
  endDate: string;
  groups?: GroupStandings[];
  knockoutRounds?: KnockoutRound[];
};

export type TournamentDevelopment = {
  tournament: {
    id: number;
    name: string;
    status: "DRAFT" | "REGISTRATION_OPEN" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
    startDate: string;
    endDate: string;
    sportId: number;
    location: string | null;
  };
  phases: DevelopmentPhase[];
};

export const developmentClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

developmentClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export async function getTournamentDevelopment(tournamentId: number): Promise<TournamentDevelopment> {
  const response = await developmentClient.get<TournamentDevelopment>(
    `/tournaments/${tournamentId}/development`,
  );
  return response.data;
}

export function developmentError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida.";
    if (error.response.status === 403) return "No tienes permiso para consultar el desarrollo del torneo.";
    if (error.response.status === 404) return "El torneo no fue encontrado.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "No fue posible consultar el desarrollo del torneo.";
}
