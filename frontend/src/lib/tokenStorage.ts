import Cookies from "js-cookie";

export const AUTH_TOKEN_COOKIE_KEY = "auth_token";

/**
 * Centralized authentication token storage utility.
 * Encapsulates cookie read/write/clear operations so HTTP clients,
 * SSE streams, WebSockets, and AuthContext share a single contract.
 */
export const tokenStorage = {
  getToken: (): string | undefined => {
    return Cookies.get(AUTH_TOKEN_COOKIE_KEY);
  },

  setToken: (token: string): void => {
    Cookies.set(AUTH_TOKEN_COOKIE_KEY, token, {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  },

  clearToken: (): void => {
    Cookies.remove(AUTH_TOKEN_COOKIE_KEY);
  },
};
