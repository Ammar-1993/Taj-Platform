import api from "@/lib/axios";
import { Subject, ApiResponse, User, Review, GradeLevel, TeacherSlotsResponse } from "@/types";

export const discoveryService = {
  /**
   * Get all available subjects
   */
  getSubjects: async () => {
    const res = await api.get<ApiResponse<Subject[]>>("/discovery/subjects");
    return res.data;
  },

  /**
   * Get list of teachers with filters
   */
  getTeachers: async (params?: Record<string, string | number | undefined>) => {
    const res = await api.get<ApiResponse<{ data: User[] }>>("/discovery/teachers", { params });
    return res.data;
  },

  /**
   * Get public slots for a specific teacher
   */
  getTeacherSlots: async (teacherId: number) => {
    const res = await api.get<TeacherSlotsResponse>(`/discovery/teachers/${teacherId}/slots`);
    return res.data;
  },

  /**
   * Get all grade levels
   */
  getGradeLevels: async () => {
    const res = await api.get<ApiResponse<GradeLevel[]>>("/discovery/grade-levels");
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
