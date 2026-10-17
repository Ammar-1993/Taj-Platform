import api from "@/lib/axios";
import { Wallet, ApiResponse, PayoutRequest } from "@/types";

export const walletService = {
  /**
   * Get wallet balance and transactions
   */
  getWallet: async (page = 1, type?: string) => {
    const res = await api.get<ApiResponse<Wallet>>("/wallet", {
      params: { page, type },
    });
    return res.data;
  },

  /**
   * Get payout request history
   */
  getPayouts: async () => {
    const res = await api.get<ApiResponse<PayoutRequest[]>>("/wallet/payouts");
    return res.data;
  },

  /**
   * Submit a new payout request
   */
  requestPayout: async (data: { amount: string; bank_name: string; iban: string }) => {
    const res = await api.post<ApiResponse<unknown>>("/wallet/payouts", data);
    return res.data;
  },
};
