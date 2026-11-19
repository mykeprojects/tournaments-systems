import axios from "axios";
import { getAuthToken } from "../storage/authSession";
import type { TournamentPhase } from "./tournamentPhaseApi";
import type { Tournament } from "./tournamentApi";
import type { TournamentRegistration } from "./tournamentRegistrationApi";

export type MatchStatus =
  | "SCHEDULED"
  | "BETTING_OPEN"
  | "BETTING_CLOSED"
  | "IN_PROGRESS"
  | "FINISHED"
  | "CANCELLED";

export type OfficialResult = "HOME" | "AWAY" | "DRAW" | "VOID";

export type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  sportId: number | null;
  tournamentId: number | null;
  phaseId: number | null;
  bracketId: number | null;
  groupId: number | null;
  venue: string | null;
  roundLabel: string | null;
  scheduledAt: string | null;
  startsAt: string;
  bettingClosesAt: string;
  status: MatchStatus;
  bettingEnabled: boolean;
  officialResult: OfficialResult | null;
  homeOdd: number;
  awayOdd: number;
  drawOdd: number;
  createdAt: string;
  updatedAt: string;
};

export type MatchInput = {
  id?: number;
  phaseId?: number;
  roundLabel?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  venue?: string;
  startsAt: string;
  homeOdd: number;
  awayOdd: number;
  drawOdd: number;
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: "Programado",
  BETTING_OPEN: "Apuestas abiertas",
  BETTING_CLOSED: "Apuestas cerradas",
  IN_PROGRESS: "En juego",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

export const matchClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

matchClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export async function listTournaments(): Promise<Tournament[]> {
  return (await matchClient.get<Tournament[]>("/tournaments")).data;
}

export async function listPhases(tournamentId: number): Promise<TournamentPhase[]> {
  return (await matchClient.get<TournamentPhase[]>(
    `/tournaments/${tournamentId}/phases`,
  )).data;
}

export async function listRegistrations(
  tournamentId: number,
): Promise<TournamentRegistration[]> {
  return (await matchClient.get<TournamentRegistration[]>(
    `/tournaments/${tournamentId}/registrations`,
  )).data;
}

export async function listMatches(
  tournamentId?: number,
  phaseId?: number,
): Promise<Match[]> {
  if (tournamentId) {
    const query = phaseId ? `?phaseId=${phaseId}` : "";
    return (await matchClient.get<Match[]>(
      `/tournaments/${tournamentId}/matches${query}`,
    )).data;
  }
  return (await matchClient.get<Match[]>("/matches")).data;
}

export async function saveMatch(
  tournamentId: number,
  input: MatchInput,
): Promise<Match> {
  const body = {
    phaseId: input.phaseId,
    roundLabel: input.roundLabel || undefined,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    venue: input.venue || undefined,
    startsAt: input.startsAt,
    homeOdd: input.homeOdd,
    awayOdd: input.awayOdd,
    drawOdd: input.drawOdd,
  };
  if (input.id) {
    return (await matchClient.patch<Match>(`/matches/${input.id}`, body)).data;
  }
  if (input.phaseId) {
    return (await matchClient.post<Match>(
      `/tournaments/${tournamentId}/phases/${input.phaseId}/matches`,
      body,
    )).data;
  }
  return (await matchClient.post<Match>(
    `/tournaments/${tournamentId}/matches`,
    body,
  )).data;
}

export async function deleteMatch(id: number): Promise<{ message: string }> {
  return (await matchClient.delete<{ message: string }>(`/matches/${id}`)).data;
}

export function matchError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida.";
    if (error.response.status === 403) return "No tienes permiso para acceder a los partidos.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (Array.isArray(message) && message.length) return message.join(" ");
  }
  return "No fue posible completar la operación.";
}
