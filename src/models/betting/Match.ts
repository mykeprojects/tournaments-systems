import type { MatchStatus } from "./MatchStatus";
import type { OfficialResult } from "./OfficialResult";

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  bettingClosesAt: string;
  status: MatchStatus;
  bettingEnabled: boolean;
  officialResult: OfficialResult | null;
  homeOdd: number;
  awayOdd: number;
  drawOdd: number;
}
