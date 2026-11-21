import { sportClient } from "../infrastructure/backend/SportHttpClient";
import type { MatchAnnotation, MatchManagement, MatchParticipantPlayer } from "../models/matches";

export interface MatchAnnotationInput {
  playerId: number;
  minute?: number;
  description: string;
}

export const matchManagementService = {
  async listMatches(): Promise<MatchManagement[]> {
    const response = await sportClient.get<MatchManagement[]>("/matches");
    return response.data;
  },

  async listAnnotations(matchId: number): Promise<MatchAnnotation[]> {
    const response = await sportClient.get<MatchAnnotation[]>(`/matches/${matchId}/annotations`);
    return response.data;
  },

  async listPlayersByTeam(teamId: number): Promise<MatchParticipantPlayer[]> {
    const response = await sportClient.get<MatchParticipantPlayer[]>("/players", {
      params: { teamId },
    });
    return response.data;
  },

  async startMatch(matchId: number): Promise<MatchManagement> {
    const response = await sportClient.post<MatchManagement>(`/matches/${matchId}/start`);
    return response.data;
  },

  async finishMatch(matchId: number): Promise<MatchManagement> {
    const response = await sportClient.post<MatchManagement>(`/matches/${matchId}/finish`);
    return response.data;
  },

  async createAnnotation(
    matchId: number,
    input: MatchAnnotationInput,
  ): Promise<MatchAnnotation> {
    const response = await sportClient.post<MatchAnnotation>(
      `/matches/${matchId}/annotations`,
      input,
    );
    return response.data;
  },

  async updateAnnotation(
    matchId: number,
    annotationId: number,
    input: MatchAnnotationInput,
  ): Promise<MatchAnnotation> {
    const response = await sportClient.patch<MatchAnnotation>(
      `/matches/${matchId}/annotations/${annotationId}`,
      input,
    );
    return response.data;
  },

  async removeAnnotation(matchId: number, annotationId: number): Promise<void> {
    await sportClient.delete(`/matches/${matchId}/annotations/${annotationId}`);
  },
};
