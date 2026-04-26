import api from "@/lib/axios";
import { StudentProfile, ApiResponse } from "@/types";

export const profileService = {
  /**
   * Get student profile
   */
  getStudentProfile: async () => {
    const res = await api.get<ApiResponse<StudentProfile>>("/profile/student");
    return res.data;
  },

  /**
   * Update student profile
   */
  updateStudentProfile: async (data: Record<string, string | number>) => {
    const res = await api.post<ApiResponse<StudentProfile>>("/profile/student", data);
    return res.data;
  },
};
