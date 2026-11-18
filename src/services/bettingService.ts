import { sportClient } from "../infrastructure/backend/SportHttpClient";
import type {
  Bet,
  CreateBetInput,
  FanPaymentMethod,
  Match,
} from "../models/betting";

export const bettingService = {
  async listAvailableMatches(): Promise<Match[]> {
    const response = await sportClient.get<Match[]>("/matches/available");
    return response.data;
  },

  async listMatches(): Promise<Match[]> {
    const response = await sportClient.get<Match[]>("/matches");
    return response.data;
  },

  async listPaymentMethods(): Promise<FanPaymentMethod[]> {
    const response = await sportClient.get<FanPaymentMethod[]>("/fans/me/payment-methods");
    return response.data;
  },

  async listMyBets(): Promise<Bet[]> {
    const response = await sportClient.get<Bet[]>("/bets/me");
    return response.data;
  },

  async listBetsByMatch(matchId: number): Promise<Bet[]> {
    const response = await sportClient.get<Bet[]>(`/matches/${matchId}/bets`);
    return response.data;
  },

  async placeBet(input: CreateBetInput): Promise<Bet> {
    const response = await sportClient.post<Bet>("/bets", input);
    return response.data;
  },

  async cancelBet(betId: number): Promise<Bet> {
    const response = await sportClient.patch<Bet>(`/bets/${betId}/cancel`);
    return response.data;
  },
};
