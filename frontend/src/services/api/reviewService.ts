import api from "@/lib/axios";
import { ApiResponse, Review } from "@/types";

export const reviewService = {
  /**
   * Submit a review for a booking
   */
  create: async (data: { booking_id: number; rating: number; comment?: string }) => {
    const res = await api.post<ApiResponse<Review>>("/reviews", data);
    return res.data;
  },

  /**
   * Get reviews for a specific teacher
   */
  getTeacherReviews: async (teacherId: number) => {
    const res = await api.get<ApiResponse<{ data: Review[] }>>(`/discovery/teachers/${teacherId}/reviews`);
    return res.data;
  },
};
