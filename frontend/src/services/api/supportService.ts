import api from "@/lib/axios";
import Cookies from "js-cookie";
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

export interface StreamChatDoneData {
  reply: string;
  needs_human_support: boolean;
  support_options: {
    whatsapp?: {
      phone: string;
      link: string;
      label: string;
    };
    ticket?: {
      link: string;
      label: string;
    };
  } | null;
  suggested_questions: string[];
  model_used?: string;
}

export interface StreamChatCallbacks {
  onToken?: (token: string) => void;
  onDone?: (data: StreamChatDoneData) => void;
  onError?: (error: Error) => void;
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
   * Send messages to the Taj AI Support Assistant synchronously.
   */
  sendMessage: async (messages: SendMessagePayload[]): Promise<SupportChatApiResponse> => {
    const res = await api.post<SupportChatApiResponse>("/support/chat", { messages });
    return res.data;
  },

  /**
   * Stream message response from the Taj AI Support Assistant via Server-Sent Events (SSE).
   */
  streamMessage: async (
    messages: SendMessagePayload[],
    callbacks: StreamChatCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = Cookies.get("auth_token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/support/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, stream: true }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Support stream request failed with status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported on this response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let currentEvent = "message";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEvent = "message";
            continue;
          }

          if (trimmed.startsWith("event:")) {
            currentEvent = trimmed.replace(/^event:\s*/, "");
          } else if (trimmed.startsWith("data:")) {
            const rawJson = trimmed.replace(/^data:\s*/, "");
            try {
              const data = JSON.parse(rawJson);
              if (currentEvent === "token" && typeof data.token === "string") {
                callbacks.onToken?.(data.token);
              } else if (currentEvent === "done") {
                callbacks.onDone?.(data);
              } else if (currentEvent === "error") {
                callbacks.onError?.(new Error(data.message || "حدث خطأ أثناء المحادثة"));
              }
            } catch {
              // Ignore partial JSON or non-JSON heartbeats
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

