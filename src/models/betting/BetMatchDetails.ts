import type { MatchStatus } from "./MatchStatus";
import type { OfficialResult } from "./OfficialResult";

export interface BetMatchDetails {
  id: number;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  status: MatchStatus;
  officialResult: OfficialResult | null;
}
