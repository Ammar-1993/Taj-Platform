import api from "@/lib/axios";
import { ApiResponse, SupportTicket, SupportTicketCreatePayload } from "@/types";

export const supportService = {
  /**
   * Get all support tickets for the current user
   */
  getAll: async () => {
    const res = await api.get<ApiResponse<SupportTicket[]>>("/support-tickets");
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
