import { renderHook, act } from "@testing-library/react";
import { useRecaptcha } from "../useRecaptcha";

describe("useRecaptcha", () => {
  const originalEnv = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
    delete (window as Window & { grecaptcha?: unknown }).grecaptcha;
    jest.useRealTimers();
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalEnv;
  });

  it("returns empty string when window.grecaptcha is not loaded", async () => {
    const { result } = renderHook(() => useRecaptcha());
    let token = "initial";
    await act(async () => {
      token = await result.current.executeRecaptcha("register");
    });
    expect(token).toBe("");
  });

  it("executes grecaptcha and resolves with token when ready", async () => {
    window.grecaptcha = {
      ready: (cb: () => void) => cb(),
      execute: jest.fn().mockResolvedValue("valid-recaptcha-token"),
    };

    const { result } = renderHook(() => useRecaptcha());
    let token = "";
    await act(async () => {
      token = await result.current.executeRecaptcha("register");
    });

    expect(window.grecaptcha.execute).toHaveBeenCalledWith("test-site-key", {
      action: "register",
    });
    expect(token).toBe("valid-recaptcha-token");
  });

  it("resolves with empty string if grecaptcha times out", async () => {
    jest.useFakeTimers();
    window.grecaptcha = {
      ready: () => {
        // Never calls callback
      },
      execute: jest.fn(),
    };

    const { result } = renderHook(() => useRecaptcha());
    let resolvedToken: string | undefined;

    act(() => {
      result.current.executeRecaptcha("register", 1000).then((t) => {
        resolvedToken = t;
      });
    });

    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    expect(resolvedToken).toBe("");
  });
});
