# Sentry APM Configuration Guide

To enable Application Performance Monitoring (APM) and Error Tracking across the Taj Educational Platform, we recommend setting up Sentry.

## 1. Backend (Laravel) Setup

1. Install the Sentry SDK:
   ```bash
   composer require sentry/sentry-laravel
   ```

2. Add your Sentry DSN to `.env`:
   ```env
   SENTRY_LARAVEL_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
   SENTRY_TRACES_SAMPLE_RATE=1.0
   ```

3. Enable Performance Monitoring in `app/Exceptions/Handler.php` (if using Laravel 10) or `bootstrap/app.php` (Laravel 11+).

## 2. Frontend (Next.js) Setup

1. Install the Sentry Next.js SDK:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

2. Follow the wizard prompts to automatically configure `instrumentation.ts`, `src/instrumentation-client.ts`, and the traditional `sentry.*.config.ts` files depending on your Next.js version.

3. Ensure to upload source maps to Sentry on production builds in Vercel.

## 3. Key Metrics to Monitor
- **Virtual Classroom Provisioning Time**: Track the duration of `ProvisionVirtualClassroom` job.
- **Agora Token Generation Time**: Monitor caching effectiveness in `ClassroomController`.
- **Whiteboard Connection Failures**: Alert if `WhiteboardService::createRoom` or `WhiteboardService::mintRoomToken` throws repeated errors.
- **Video/Audio Call Failures**: Track errors in `AgoraCall.tsx` related to track creation, token renewal, and adaptive encoder failures.

## 4. Environment Variables Checklist
Ensure these variables are set with their actual values in your production dashboards, not just masked placeholders in `.env.example`:
- **Backend (Render):** `SENTRY_LARAVEL_DSN`
- **Frontend (Vercel):** `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN`
