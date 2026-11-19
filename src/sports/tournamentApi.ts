import axios from "axios";
import { getAuthToken } from "../storage/authSession";

export type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "IN_PROGRESS"
  | "FINISHED"
  | "CANCELLED";

export type Tournament = {
  id: number;
  name: string;
  nameKey: string;
  description: string;
  sportId: number;
  location: string | null;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  createdAt: string;
  updatedAt: string;
};

export type TournamentInput = {
  id?: number;
  name: string;
  description: string;
  sportId: number;
  location: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
};

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  DRAFT: "Borrador",
  REGISTRATION_OPEN: "Inscripciones abiertas",
  IN_PROGRESS: "En progreso",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

export const tournamentClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

tournamentClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export async function listTournaments(): Promise<Tournament[]> {
  const response = await tournamentClient.get<Tournament[]>("/tournaments");
  return response.data;
}

export async function saveTournament(input: TournamentInput): Promise<{ tournament: Tournament; message: string }> {
  const body = {
    name: input.name,
    description: input.description,
    sportId: input.sportId,
    location: input.location || undefined,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
  };
  const response = input.id
    ? await tournamentClient.patch<Tournament & { message?: string }>(`/tournaments/${input.id}`, body)
    : await tournamentClient.post<Tournament & { message?: string }>("/tournaments", body);
  return {
    tournament: response.data,
    message: response.data.message ?? (input.id ? "Torneo actualizado correctamente." : "Torneo creado correctamente."),
  };
}

export async function deleteTournament(id: number): Promise<{ message: string }> {
  const response = await tournamentClient.delete<{ message: string }>(`/tournaments/${id}`);
  return response.data;
}

export function tournamentError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida.";
    if (error.response.status === 403) return "No tienes permiso para gestionar torneos.";
    if (error.response.status === 503) return "El servicio de seguridad no está disponible.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "No fue posible completar la operación.";
}
