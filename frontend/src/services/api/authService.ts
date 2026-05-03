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
  register: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse<LoginResponse>>("/auth/register", data);
    return res.data;
  },

  /**
   * Send a password reset link to the user's email.
   */
  forgotPassword: async (email: string) => {
    const res = await api.post<ApiResponse<unknown>>("/auth/forgot-password", { email });
    return res.data;
  },

  /**
   * Reset the user's password using the token sent by email.
   */
  resetPassword: async (data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) => {
    const res = await api.post<ApiResponse<unknown>>("/auth/reset-password", data);
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

  /**
   * Update current user profile
   */
  updateUser: async (data: FormData | Record<string, unknown>) => {
    const isFormData = data instanceof FormData;
    const res = await api.post<ApiResponse<User>>("/auth/me", data, {
      params: isFormData ? { _method: 'PUT' } : undefined,
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  },
};
