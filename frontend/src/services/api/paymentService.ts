import api from "@/lib/axios";
import { ApiResponse } from "@/types";

export interface PaymentSession {
  payment_id: string;
  checkout_url: string;
  amount: number;
  status: string;
}

export const paymentService = {
  /**
   * Create a payment session with the gateway
   */
  createSession: async (amount: number) => {
    const res = await api.post<ApiResponse<PaymentSession>>("/payments/create", { amount });
    return res.data;
  },
};