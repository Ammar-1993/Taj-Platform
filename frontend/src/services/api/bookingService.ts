import api from "@/lib/axios";
import { Booking, ApiResponse, PaginatedApiResponse, ClassroomAccess } from "@/types";

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
};
