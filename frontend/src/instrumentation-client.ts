import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 20% sampling in production to control costs
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Capture session replays only on errors
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  enabled: process.env.NODE_ENV === "production",

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
