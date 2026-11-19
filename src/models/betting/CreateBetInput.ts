import type { BetSelection } from "./BetSelection";

export interface CreateBetInput {
  matchId: number;
  fanPaymentMethodId: number;
  selection: BetSelection;
  stakeAmount: number;
}
