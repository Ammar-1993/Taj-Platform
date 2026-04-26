import api from "@/lib/axios";
import { ApiResponse, ParentDashboardData, User } from "@/types";

export const parentService = {
  /**
   * Get unified parent dashboard data
   */
  getDashboardData: async () => {
    const res = await api.get<ApiResponse<ParentDashboardData>>("/parent/dashboard");
    return res.data;
  },

  /**
   * Get list of children
   */
  getChildren: async () => {
    const res = await api.get<ApiResponse<User[]>>("/parent/children");
    return res.data;
  },

  /**
   * Add a new child
   */
  addChild: async (data: Record<string, string>) => {
    const res = await api.post<ApiResponse<User>>("/parent/children", data);
    return res.data;
  },

  /**
   * Toggle child permission
   */
  toggleChildPermission: async (childId: number) => {
    const res = await api.patch<ApiResponse<unknown>>(`/parent/children/${childId}/toggle-permission`);
    return res.data;
  },
};
