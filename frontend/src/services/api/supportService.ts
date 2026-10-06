import api from "@/lib/axios";
import { SupportChatApiResponse } from "@/types";

export interface SendMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

export const supportService = {
  /**
   * Send messages to the Taj AI Support Assistant.
   */
  sendMessage: async (messages: SendMessagePayload[]): Promise<SupportChatApiResponse> => {
    const res = await api.post<SupportChatApiResponse>("/support/chat", { messages });
    return res.data;
  },
};
