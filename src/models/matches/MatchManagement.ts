import type { MatchStatus, OfficialResult } from "../betting";

export interface MatchManagement {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  sportId: number | null;
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
}
