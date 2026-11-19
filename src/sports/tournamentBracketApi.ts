import axios from "axios";
import { getAuthToken } from "../storage/authSession";
import type { Tournament } from "./tournamentApi";

export type BracketRound = "QUARTERFINAL" | "SEMIFINAL" | "FINAL";
export type BracketStatus = "PENDING" | "FINISHED" | "CANCELLED";

export type BracketTeam = {
  id: number;
  code: string;
  name: string;
  shortName: string;
  city: string;
  status: "active" | "inactive";
};

export type TournamentPhase = {
  id: number;
  tournamentId: number;
  name: string;
  phaseType: "GROUPS" | "KNOCKOUT";
  status: "PLANNED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
};

export type TournamentBracket = {
  id: number;
  phaseId: number;
  roundType: BracketRound;
  bracketOrder: number;
  teamAId: number | null;
  teamBId: number | null;
  winnerTeamId: number | null;
  status: BracketStatus;
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  winnerTeam: BracketTeam | null;
};

export type SaveBracketInput = {
  roundType: BracketRound;
  bracketOrder: number;
  teamAId: number | null;
  teamBId: number | null;
  winnerTeamId: number | null;
  status: BracketStatus;
};

export const ROUND_LABEL: Record<BracketRound, string> = {
  QUARTERFINAL: "Cuartos de final",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

export const bracketClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

bracketClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export async function listTournaments(): Promise<Tournament[]> {
  return (await bracketClient.get<Tournament[]>("/tournaments")).data;
}

export async function listPhases(tournamentId: number): Promise<TournamentPhase[]> {
  return (await bracketClient.get<TournamentPhase[]>(
    `/tournaments/${tournamentId}/phases`,
  )).data;
}

export async function listBrackets(
  tournamentId: number,
  phaseId: number,
): Promise<TournamentBracket[]> {
  return (await bracketClient.get<TournamentBracket[]>(
    `/tournaments/${tournamentId}/phases/${phaseId}/brackets`,
  )).data;
}

export async function generateBrackets(
  tournamentId: number,
  phaseId: number,
): Promise<TournamentBracket[]> {
  return (await bracketClient.post<TournamentBracket[]>(
    `/tournaments/${tournamentId}/phases/${phaseId}/brackets/generate`,
  )).data;
}

export async function saveBracket(
  tournamentId: number,
  phaseId: number,
  input: SaveBracketInput,
): Promise<TournamentBracket> {
  return (await bracketClient.post<TournamentBracket>(
    `/tournaments/${tournamentId}/phases/${phaseId}/brackets`,
    input,
  )).data;
}

export async function setBracketWinner(
  tournamentId: number,
  phaseId: number,
  bracketId: number,
  winnerTeamId: number,
): Promise<TournamentBracket> {
  return (await bracketClient.patch<TournamentBracket>(
    `/tournaments/${tournamentId}/phases/${phaseId}/brackets/${bracketId}/winner`,
    { winnerTeamId },
  )).data;
}

export async function deleteBracket(
  tournamentId: number,
  phaseId: number,
  bracketId: number,
): Promise<{ message: string }> {
  return (await bracketClient.delete<{ message: string }>(
    `/tournaments/${tournamentId}/phases/${phaseId}/brackets/${bracketId}`,
  )).data;
}

export function bracketError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida.";
    if (error.response.status === 403) return "No tienes permiso para gestionar fases finales.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "No fue posible completar la operación.";
}
