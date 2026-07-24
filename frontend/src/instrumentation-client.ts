import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // تستخدم VERCEL_ENV إذا كانت موجودة (production/preview) وإلا NODE_ENV (development)
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

  // 20% sampling in production to control costs
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Capture session replays only on errors
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,

  integrations: (defaults) => {
    let replayIntegration = null;

    if (typeof window !== "undefined") {
      // Prevent Multiple Sentry Session Replay instances if this file is evaluated multiple times
      if (!(window as any).__sentryReplayAdded) {
        (window as any).__sentryReplayAdded = true;
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

    // Filter out the default Replay integration if it was automatically added
    const filteredDefaults = defaults.filter(
      (integration) => integration.name !== "Replay"
    );

    return [
      ...filteredDefaults,
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ...(replayIntegration ? [replayIntegration] : [])
    ];
  },

  enableLogs: true,
  enabled: true, // تفعيل Sentry في بيئة التطوير مؤقتاً للاختبار

  beforeSend(event) {
    // Don't report expected Agora SDK cleanup errors
    const msg = event.exception?.values?.[0]?.value ?? "";
    if (msg.includes("WS_ABORT") || msg.includes("OPERATION_ABORTED")) {
      return null;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
