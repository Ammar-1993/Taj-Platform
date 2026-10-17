import api from "@/lib/axios";
import { ApiResponse, Review } from "@/types";
import { discoveryService } from "./discoveryService";

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
  getTeacherReviews: async (teacherId: number, page?: number) => {
    return discoveryService.getTeacherReviews(teacherId, page);
  },
};
