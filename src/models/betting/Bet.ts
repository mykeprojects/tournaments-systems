import type { BetMatchDetails } from "./BetMatchDetails";
import type { BetSelection } from "./BetSelection";
import type { BetStatus } from "./BetStatus";

export interface Bet {
  id: number;
  matchId: number;
  fanId: number;
  fanPaymentMethodId: number;
  selection: BetSelection;
  stakeAmount: number;
  lockedOdd: number;
  status: BetStatus;
  settledAmount: number;
  settled: boolean;
  settledAt: string | null;
  createdAt: string;
  match?: BetMatchDetails | null;
  fanExternalUserId?: number;
}
