export interface MatchAnnotation {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  minute: number | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}
