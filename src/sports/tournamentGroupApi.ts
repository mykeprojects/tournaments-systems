import axios from "axios";
import { getAuthToken } from "../storage/authSession";
import type { Tournament } from "./tournamentApi";

export type TournamentPhase = {
  id: number;
  tournamentId: number;
  name: string;
  phaseType: "GROUPS" | "KNOCKOUT";
  status: "PLANNED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
};

export type TournamentGroupTeam = {
  id: number;
  code: string;
  name: string;
  shortName: string;
  city: string;
  status: "active" | "inactive";
};

export type TournamentGroup = {
  id: number;
  phaseId: number;
  name: string;
  nameKey: string;
  groupOrder: number;
  maxTeams: number | null;
  teams: TournamentGroupTeam[];
};

export type TournamentRegistration = {
  teamId: number;
  team: TournamentGroupTeam;
};

export type TournamentGroupInput = {
  id?: number;
  name: string;
  groupOrder: number;
  maxTeams: number | null;
};

export const groupClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

groupClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export async function listTournaments(): Promise<Tournament[]> {
  return (await groupClient.get<Tournament[]>("/tournaments")).data;
}

export async function listPhases(tournamentId: number): Promise<TournamentPhase[]> {
  return (await groupClient.get<TournamentPhase[]>(
    `/tournaments/${tournamentId}/phases`,
  )).data;
}

export async function listGroups(
  tournamentId: number,
  phaseId: number,
): Promise<TournamentGroup[]> {
  return (await groupClient.get<TournamentGroup[]>(
    `/tournaments/${tournamentId}/phases/${phaseId}/groups`,
  )).data;
}

export async function saveGroup(
  tournamentId: number,
  phaseId: number,
  input: TournamentGroupInput,
): Promise<TournamentGroup> {
  const body = {
    name: input.name,
    groupOrder: input.groupOrder,
    maxTeams: input.maxTeams,
  };
  const response = input.id
    ? await groupClient.patch<TournamentGroup>(
        `/tournaments/${tournamentId}/phases/${phaseId}/groups/${input.id}`,
        body,
      )
    : await groupClient.post<TournamentGroup>(
        `/tournaments/${tournamentId}/phases/${phaseId}/groups`,
        body,
      );
  return response.data;
}

export async function deleteGroup(
  tournamentId: number,
  phaseId: number,
  groupId: number,
): Promise<{ message: string }> {
  return (await groupClient.delete<{ message: string }>(
    `/tournaments/${tournamentId}/phases/${phaseId}/groups/${groupId}`,
  )).data;
}

export async function assignTeam(
  tournamentId: number,
  phaseId: number,
  groupId: number,
  teamId: number,
): Promise<{ message: string }> {
  return (await groupClient.post<{ message: string }>(
    `/tournaments/${tournamentId}/phases/${phaseId}/groups/${groupId}/teams`,
    { teamId },
  )).data;
}

export async function removeTeam(
  tournamentId: number,
  phaseId: number,
  groupId: number,
  teamId: number,
): Promise<{ message: string }> {
  return (await groupClient.delete<{ message: string }>(
    `/tournaments/${tournamentId}/phases/${phaseId}/groups/${groupId}/teams/${teamId}`,
  )).data;
}

export async function listRegistrations(
  tournamentId: number,
): Promise<TournamentRegistration[]> {
  return (await groupClient.get<TournamentRegistration[]>(
    `/tournaments/${tournamentId}/registrations`,
  )).data;
}

export function groupError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida.";
    if (error.response.status === 403) return "No tienes permiso para gestionar grupos.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "No fue posible completar la operación.";
}
