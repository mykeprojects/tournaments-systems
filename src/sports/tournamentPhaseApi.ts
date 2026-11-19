import axios from "axios";
import { getAuthToken } from "../storage/authSession";
import type { Tournament } from "./tournamentApi";

export type TournamentPhaseType = "GROUPS" | "KNOCKOUT";
export type TournamentPhaseStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "FINISHED"
  | "CANCELLED";

export type TournamentPhase = {
  id: number;
  tournamentId: number;
  name: string;
  nameKey: string;
  phaseOrder: number;
  phaseType: TournamentPhaseType;
  startDate: string;
  endDate: string;
  status: TournamentPhaseStatus;
  createdAt: string;
  updatedAt: string;
};

export type TournamentPhaseInput = {
  id?: number;
  name: string;
  phaseOrder: number;
  phaseType: TournamentPhaseType;
  startDate: string;
  endDate: string;
  status: TournamentPhaseStatus;
};

export const PHASE_TYPE_LABEL: Record<TournamentPhaseType, string> = {
  GROUPS: "Fase de grupos",
  KNOCKOUT: "Fase eliminatoria",
};

export const PHASE_STATUS_LABEL: Record<TournamentPhaseStatus, string> = {
  PLANNED: "Programada",
  IN_PROGRESS: "En progreso",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
};

export const phaseClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

phaseClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export async function listTournaments(): Promise<Tournament[]> {
  const response = await phaseClient.get<Tournament[]>("/tournaments");
  return response.data;
}

export async function listTournamentPhases(tournamentId: number): Promise<TournamentPhase[]> {
  const response = await phaseClient.get<TournamentPhase[]>(
    `/tournaments/${tournamentId}/phases`,
  );
  return response.data;
}

export async function saveTournamentPhase(
  tournamentId: number,
  input: TournamentPhaseInput,
): Promise<TournamentPhase> {
  const body = {
    name: input.name,
    phaseOrder: input.phaseOrder,
    phaseType: input.phaseType,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
  };
  const response = input.id
    ? await phaseClient.patch<TournamentPhase>(
        `/tournaments/${tournamentId}/phases/${input.id}`,
        body,
      )
    : await phaseClient.post<TournamentPhase>(
        `/tournaments/${tournamentId}/phases`,
        body,
      );
  return response.data;
}

export async function deleteTournamentPhase(
  tournamentId: number,
  phaseId: number,
): Promise<{ message: string }> {
  const response = await phaseClient.delete<{ message: string }>(
    `/tournaments/${tournamentId}/phases/${phaseId}`,
  );
  return response.data;
}

export function phaseError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida.";
    if (error.response.status === 403) return "No tienes permiso para gestionar fases.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "No fue posible completar la operación.";
}
