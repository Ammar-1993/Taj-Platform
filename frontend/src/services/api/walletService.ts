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
  requestPayout: async (data: { amount: string; bank_name: string }) => {
    const res = await api.post<ApiResponse<unknown>>("/wallet/payouts", data);
    return res.data;
  },

  /**
   * Record a payment (for mock top-up or webhook simulation)
   */
  recordPayment: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<unknown>>("/webhooks/payment", data);
    return res.data;
  },
};
