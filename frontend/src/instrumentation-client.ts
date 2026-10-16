const isEnabled =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_SENTRY_DEV === "true";

if (isEnabled) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      // تستخدم VERCEL_ENV إذا كانت موجودة (production/preview) وإلا NODE_ENV (development)
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

      // Route through the Next.js same-origin tunnel to circumvent ad-blockers & regional ISP timeouts
      tunnel: "/monitoring",

      // Ignore client network timeouts and ad-blocker sinkholes to avoid capturing them as application errors
      ignoreErrors: [
        "ERR_CONNECTION_TIMED_OUT",
        "Failed to fetch",
        "NetworkError",
        "Network request failed",
        "Load failed",
        "ERR_BLOCKED_BY_CLIENT",
        "net::ERR_FAILED",
      ],

      // 20% sampling in production to control costs
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0.05,

      // Capture session replays only on errors in production
      replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0.0,
      replaysSessionSampleRate: 0.0,

      integrations: (defaults) => {
        let replayIntegration = null;

        if (process.env.NODE_ENV === "production") {
          if (typeof window !== "undefined") {
            // Prevent Multiple Sentry Session Replay instances if this file is evaluated multiple times
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            if (!win.__sentryReplayAdded) {
              win.__sentryReplayAdded = true;
              replayIntegration = Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
              });
            }
          } else {
            // On server/edge just in case this gets run there, though it's -client
            replayIntegration = Sentry.replayIntegration({
              maskAllText: false,
              blockAllMedia: false,
            });
          }
        }

        // Filter out the default Replay integration if it was automatically added
        const filteredDefaults = defaults.filter(
          (integration) => integration.name !== "Replay"
        );

        return [
          ...filteredDefaults,
          Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
          ...(replayIntegration ? [replayIntegration] : []),
        ];
      },

      enableLogs: process.env.NODE_ENV === "production",
      enabled: true,

      beforeSendLog(log) {
        const msg = typeof log.message === "string" ? log.message : "";
        // Circuit breaker: drop any console log mentioning Sentry transport/tunneling to break recursive loops
        if (
          msg.includes("sentry.io") ||
          msg.includes("envelope") ||
          msg.includes("/monitoring") ||
          msg.includes("ERR_CONNECTION_TIMED_OUT") ||
          msg.includes("ERR_BLOCKED_BY_CLIENT")
        ) {
          return null;
        }
        return log;
      },

      beforeSend(event) {
        // 1. Don't report expected Agora SDK cleanup errors
        const msg = event.exception?.values?.[0]?.value ?? "";
        if (msg.includes("WS_ABORT") || msg.includes("OPERATION_ABORTED")) {
          return null;
        }

        // 2. Prevent infinite logging/replay loops from Sentry transport/tunnel failures
        if (
          msg.includes("sentry.io") ||
          msg.includes("envelope") ||
          msg.includes("/monitoring") ||
          msg.includes("ERR_CONNECTION_TIMED_OUT") ||
          msg.includes("ERR_BLOCKED_BY_CLIENT")
        ) {
          return null;
        }

        // 3. Drop self-referential Sentry logger/transport events
        if (event.logger === "console" && (msg.includes("sentry") || msg.includes("ingest"))) {
          return null;
        }

        return event;
      },
    });
  });
}

export const onRouterTransitionStart = (...args: [string, ...unknown[]]) => {
  if (isEnabled) {
    import("@sentry/nextjs").then((Sentry) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Sentry.captureRouterTransitionStart as any)?.(...args);
    });
  }
};

