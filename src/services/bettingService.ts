import { sportClient } from "../infrastructure/backend/SportHttpClient";
import type {
  Bet,
  CreateBetInput,
  FanPaymentMethod,
  Match,
  PaymentMethodCatalog,
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

  async listPaymentMethodCatalog(): Promise<PaymentMethodCatalog[]> {
    const response = await sportClient.get<PaymentMethodCatalog[]>(
      "/payment-method"
    );
    return response.data;
  },

  async createPaymentMethod(input: {
    paymentMethodId: number;
    maskedReference?: string;
    holderName?: string;
    isActive?: boolean;
  }): Promise<FanPaymentMethod> {
    const response = await sportClient.post<FanPaymentMethod>(
      "/fans/me/payment-methods",
      input
    );
    return response.data;
  },

  async updatePaymentMethod(
    id: number,
    input: { maskedReference?: string; holderName?: string; isActive?: boolean }
  ): Promise<FanPaymentMethod> {
    const response = await sportClient.patch<FanPaymentMethod>(
      `/fans/me/payment-methods/${id}`,
      input
    );
    return response.data;
  },

  async removePaymentMethod(id: number): Promise<{ message: string }> {
    const response = await sportClient.delete<{ message: string }>(
      `/fans/me/payment-methods/${id}`
    );
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
