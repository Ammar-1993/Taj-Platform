import api from "@/lib/axios";
import {
  ApiResponse,
  PaginatedApiResponse,
  SupportChatApiResponse,
  SupportTicket,
  SupportTicketCreatePayload,
} from "@/types";

export interface SendMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

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

  /**
   * Send messages to the Taj AI Support Assistant.
   */
  sendMessage: async (messages: SendMessagePayload[]): Promise<SupportChatApiResponse> => {
    const res = await api.post<SupportChatApiResponse>("/support/chat", { messages });
    return res.data;
  },
};
