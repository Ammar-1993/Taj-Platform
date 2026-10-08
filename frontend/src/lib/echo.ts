import Echo from "laravel-echo";
import Pusher from "pusher-js";
import Cookies from "js-cookie";

let echoInstance: Echo<"reverb"> | null = null;

/**
 * Get or initialize the singleton Laravel Echo instance configured for Laravel Reverb.
 */
export const getEcho = (): Echo<"reverb"> | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const token = Cookies.get("auth_token");

  if (echoInstance) {
    // Update authorization header if token changed
    if (token && echoInstance.connector?.options?.auth?.headers) {
      echoInstance.connector.options.auth.headers.Authorization = `Bearer ${token}`;
    }
    return echoInstance;
  }

  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY || "taj-reverb-key";
  const host =
    process.env.NEXT_PUBLIC_REVERB_HOST ||
    (window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname);
  const port = parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || "8080", 10);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || (window.location.protocol === "https:" ? "https" : "http");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const authEndpoint = `${apiUrl.replace(/\/v1\/?$/, "")}/broadcasting/auth`;

  // Attach Pusher to window to satisfy Echo requirements
  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  try {
    echoInstance = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint,
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      },
    });
  } catch (err) {
    console.warn("[Echo] Failed to initialize Laravel Reverb WebSocket client:", err);
    return null;
  }

  return echoInstance;
};

/**
 * Disconnect and tear down the Echo WebSocket connection.
 */
export const disconnectEcho = (): void => {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // Ignored
    }
    echoInstance = null;
  }
};
