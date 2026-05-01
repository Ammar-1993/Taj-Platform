import api from "@/lib/axios";
import { ApiResponse, PaginatedApiResponse, SupportTicket, SupportTicketCreatePayload } from "@/types";

export const supportService = {
  /**
   * Get all support tickets for the current user
   */
  getAll: async (page?: number) => {
    const res = await api.get<PaginatedApiResponse<SupportTicket>>("/support-tickets", {
      params: { page },
    });
    return res.data;
  },

  /**
   * Create a new support ticket
   */
  create: async (data: SupportTicketCreatePayload) => {
    const res = await api.post<ApiResponse<SupportTicket>>("/support-tickets", data);
    return res.data;
  },
};
