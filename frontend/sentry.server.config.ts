import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0.05,
  enableLogs: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
  enabled: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SENTRY_DEV === "true",
});
