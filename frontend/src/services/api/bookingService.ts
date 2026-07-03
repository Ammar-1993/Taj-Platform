import api from "@/lib/axios";
import { Booking, ApiResponse, PaginatedApiResponse, ClassroomAccess, WhiteboardStatusResponse } from "@/types";

export const bookingService = {
  /**
   * Get all bookings for the current user
   */
  getAll: async (params?: Record<string, string | number | undefined>) => {
    const res = await api.get<PaginatedApiResponse<Booking>>("/bookings", { params });
    return res.data;
  },

  /**
   * Create a new booking
   */
  create: async (data: { teacher_slot_id: number; promo_code?: string; child_id?: string }) => {
    const res = await api.post<ApiResponse<Booking>>("/bookings", data);
    return res.data;
  },

  /**
   * Cancel a booking
   */
  cancel: async (id: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/bookings/${id}/cancel`);
    return res.data;
  },

  /**
   * Complete a booking
   */
  complete: async (id: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/bookings/${id}/complete`);
    return res.data;
  },

  /**
   * Get classroom access token and data
   */
  getClassroomAccess: async (id: number) => {
    const res = await api.get<ApiResponse<ClassroomAccess>>(`/bookings/${id}/classroom`);
    return res.data;
  },

  /**
   * Lightweight poll for whiteboard readiness.
   * Unlike getClassroomAccess, this has zero side effects (no DB writes,
   * no Agora token generation). Safe to call every 2–3 seconds.
   */
  getWhiteboardStatus: async (id: number) => {
    const res = await api.get<WhiteboardStatusResponse>(`/bookings/${id}/classroom/whiteboard-status`);
    return res.data;
  },

  /**
   * Force-refresh a whiteboard room token that has expired mid-session.
   * Bypasses the backend cache and mints a brand-new Netless token.
   */
  refreshWhiteboardToken: async (id: number) => {
    const res = await api.post<{ status: string; room_token: string }>(
      `/bookings/${id}/classroom/whiteboard-token`
    );
    return res.data;
  },

  /**
   * Silently refresh classroom tokens
   */
  refreshClassroomToken: async (id: number) => {
    const res = await api.get<ApiResponse<{ token: string; screen_token: string | null }>>(`/bookings/${id}/refresh-token`);
    return res.data;
  },

  /**
   * Send heartbeat during classroom session
   */
  sendHeartbeat: (bookingId: number) => api.post(`/bookings/${bookingId}/heartbeat`),
};
