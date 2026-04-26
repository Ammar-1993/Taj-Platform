import api from "@/lib/axios";
import { ApiResponse, User } from "@/types";

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: Record<string, string>) => {
    const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", credentials);
    return res.data;
  },

  /**
   * Register a new user
   */
  register: async (data: Record<string, any>) => {
    const res = await api.post<ApiResponse<LoginResponse>>("/auth/register", data);
    return res.data;
  },

  /**
   * Logout current user
   */
  logout: async () => {
    const res = await api.post<ApiResponse<unknown>>("/auth/logout");
    return res.data;
  },

  /**
   * Get current user profile
   */
  getMe: async () => {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data;
  },
};
