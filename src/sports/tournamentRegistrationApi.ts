import axios from "axios";
import { getAuthToken } from "../storage/authSession";
import type { Tournament } from "./tournamentApi";

export type TournamentRegistration = {
  id: number;
  tournamentId: number;
  teamId: number;
  status: "REGISTERED";
  registeredAt: string;
  team: {
    id: number;
    code: string;
    name: string;
    shortName: string;
    city: string;
    status: "active" | "inactive";
  };
};

export const registrationClient = axios.create({
  baseURL: import.meta.env.VITE_SPORT_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

registrationClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export async function listTournaments(): Promise<Tournament[]> {
  const response = await registrationClient.get<Tournament[]>("/tournaments");
  return response.data;
}

export async function listRegistrations(tournamentId: number): Promise<TournamentRegistration[]> {
  const response = await registrationClient.get<TournamentRegistration[]>(
    `/tournaments/${tournamentId}/registrations`,
  );
  return response.data;
}

export async function registerTeam(tournamentId: number, teamId: number): Promise<{ message: string }> {
  const response = await registrationClient.post<{ message: string }>(
    `/tournaments/${tournamentId}/registrations`,
    { teamId },
  );
  return response.data;
}

export async function withdrawTeam(tournamentId: number, teamId: number): Promise<{ message: string }> {
  const response = await registrationClient.delete<{ message: string }>(
    `/tournaments/${tournamentId}/registrations/${teamId}`,
  );
  return response.data;
}

export function registrationError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No fue posible conectar con el servicio deportivo.";
    if (error.response.status === 401) return "La sesión no es válida.";
    if (error.response.status === 403) return "No tienes permiso para gestionar inscripciones.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "No fue posible completar la operación.";
}
