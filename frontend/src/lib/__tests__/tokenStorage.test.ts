import Cookies from "js-cookie";
import { tokenStorage, AUTH_TOKEN_COOKIE_KEY } from "../tokenStorage";

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

describe("tokenStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retrieves auth_token from cookies", () => {
    (Cookies.get as jest.Mock).mockReturnValue("mock-jwt-token");
    expect(tokenStorage.getToken()).toBe("mock-jwt-token");
    expect(Cookies.get).toHaveBeenCalledWith(AUTH_TOKEN_COOKIE_KEY);
  });

  it("stores auth_token with strict SameSite and 7-day expiry", () => {
    tokenStorage.setToken("new-token");
    expect(Cookies.set).toHaveBeenCalledWith(
      AUTH_TOKEN_COOKIE_KEY,
      "new-token",
      expect.objectContaining({
        expires: 7,
        sameSite: "strict",
      })
    );
  });

  it("clears auth_token from cookies", () => {
    tokenStorage.clearToken();
    expect(Cookies.remove).toHaveBeenCalledWith(AUTH_TOKEN_COOKIE_KEY);
  });
});
