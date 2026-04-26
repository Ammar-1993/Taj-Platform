import api from "@/lib/axios";
import { TeacherProfile, ApiResponse, SlotsByDate } from "@/types";

export const teacherService = {
  /**
   * Get teacher profile
   */
  getProfile: async () => {
    const res = await api.get<ApiResponse<TeacherProfile>>("/profile/teacher");
    return res.data;
  },

  /**
   * Update teacher profile (with files)
   */
  updateProfile: async (formData: FormData) => {
    const res = await api.post<ApiResponse<TeacherProfile>>("/profile/teacher", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  /**
   * Get teacher's own slots (for schedule management)
   */
  getOwnSlots: async () => {
    const res = await api.get<ApiResponse<SlotsByDate>>("/teacher/slots");
    return res.data;
  },

  /**
   * Create a new slot
   */
  createSlot: async (data: { slot_date: string; start_time: string; end_time: string }) => {
    const res = await api.post<ApiResponse<unknown>>("/teacher/slots", data);
    return res.data;
  },

  /**
   * Delete a slot
   */
  deleteSlot: async (id: number) => {
    const res = await api.delete<ApiResponse<unknown>>(`/teacher/slots/${id}`);
    return res.data;
  },
};
