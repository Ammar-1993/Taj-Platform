import { useCallback } from "react";

export interface GreCAPTCHA {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: GreCAPTCHA;
  }
}

/**
 * Reusable hook for executing Google reCAPTCHA v3 actions with a safety timeout.
 */
export function useRecaptcha() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const executeRecaptcha = useCallback(
    async (action: string, timeoutMs = 8000): Promise<string> => {
      if (typeof window === "undefined" || !window.grecaptcha || !siteKey) {
        return "";
      }

      try {
        return await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("reCAPTCHA timeout")),
            timeoutMs
          );

          window.grecaptcha!.ready(() => {
            window
              .grecaptcha!.execute(siteKey, { action })
              .then((token: string) => {
                clearTimeout(timeout);
                resolve(token);
              })
              .catch((err: unknown) => {
                clearTimeout(timeout);
                reject(err);
              });
          });
        });
      } catch (reError) {
        console.error("reCAPTCHA Error:", reError);
        return "";
      }
    },
    [siteKey]
  );

  return { siteKey, executeRecaptcha };
}
