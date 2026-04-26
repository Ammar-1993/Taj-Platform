import api from "@/lib/axios";
import { ApiResponse, AppNotification } from "@/types";

export const notificationService = {
  /**
   * Get all notifications
   */
  getAll: async () => {
    const res = await api.get<ApiResponse<AppNotification[]>>("/notifications");
    return res.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string) => {
    const res = await api.post<ApiResponse<unknown>>(`/notifications/${id}/read`);
    return res.data;
  },
};
