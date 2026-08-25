# Taj Educational Platform (منصة تاج التعليمية) - Project Instructions

This file serves as the foundational mandate for all development work on the Taj Educational Platform. Adhere strictly to these conventions and architectural patterns.

## 🏗 System Architecture

The project is a decoupled monorepo:
- **Backend:** Laravel 12 REST API + FilamentPHP v3 Admin Dashboard.
- **Frontend:** Next.js 14 (App Router) + TypeScript.
- **Database:** MySQL 8.0.
- **Real-time:** WebRTC via Agora RTC SDK.
- **Environment:** Containerized via Docker Compose.

---

## 🛠 Tech Stack & Conventions

### Backend (`/backend`)
- **Framework:** Laravel 12.0
- **Admin Panel:** FilamentPHP v3 (Localized in Arabic/RTL).
- **Authentication:** Laravel Sanctum (Token-based).
- **Permissions:** Spatie Laravel Permission (RBAC).
- **Coding Style:** Follow PSR-12 and Laravel's idiomatic patterns. Use `laravel/pint` for linting.
- **API Design:** Versioned routes (e.g., `/api/v1/...`). Ensure consistent JSON response structures.

### Frontend (`/frontend`)
- **Framework:** Next.js 14.2 (App Router).
- **Language:** TypeScript (Strict mode enabled).
- **State Management:** TanStack Query (React Query) for server state.
- **Styling:** Tailwind CSS 3.4.
- **Components:** Modular, functional components with Lucide icons.
- **Localization:** Full Arabic (RTL) support is mandatory for all UI changes.

---

## 🔐 Core Workflows

### 1. Teacher Onboarding & Verification
- Teachers register and must complete their profile (`completeTeacherProfile`).
- **KYC:** National ID and Degree uploads are mandatory.
- **Verification:** Administrative approval via Filament is required before the teacher appears in search results.
- **State Trigger:** Any profile or document update resets `is_verified` to `false`.

### 2. Financial & Booking Flow
- **Escrow System:** Payments are deducted from the student/parent wallet upon booking and held by the platform.
- **Payout:** Teacher earnings (80% of net paid) are only released to their wallet when the teacher marks the session as `completed`.
- **Refunds:** Cancellations by teachers or admins trigger an automatic refund to the original payer's wallet.

---

## 🚀 Development Workflow

### Setup
```bash
docker-compose up -d --build
docker-compose exec laravel.test composer install
docker-compose exec laravel.test php artisan migrate --seed
```

### Testing
- **Backend:** `php artisan test` (Uses PHPUnit).
- **Frontend:** `npm run test` (Uses Jest).
- **Mandate:** Always add a new test case for bug fixes or new features.

### Deployment Hints
- Backend hosted on Render (Beta).
- Frontend hosted on Vercel (Beta).
- Ensure `FRONTEND_URL` and `MOYASAR_SECRET_KEY` are configured in `.env`.

---

## 📝 Subdirectory Instructions
- [Backend Instructions](./backend/GEMINI.md) (Optional - create if backend-specific logic expands)
- [Frontend Instructions](./frontend/GEMINI.md) (Optional - create if frontend-specific logic expands)

## 📖 Session Log & Recent Updates (Jul 25, 2026)
This section tracks recent architectural improvements and bug fixes for future reference:

### 1. Interactive Whiteboard (White-Web-SDK)
- **State Synchronization:** Used `Agora RTM` to broadcast a `type: 'whiteboard_toggle'` message. The teacher's toggle of the whiteboard visibility is now automatically synchronized to the student.
- **Connection Indicators:** Added dynamic badges (🟢 Connected, 🟡 Reconnecting, 🔴 Disconnected) tied to `roomInstance.phase` for students.
- **Focus Mode & Mobile UX:**
  - Extended Focus Mode to students (not just teachers) as a local UI preference.
  - Implemented `requestFullscreen` and `screen.orientation.lock("landscape")` (with `any` cast bypass to fix TS errors) so that activating Focus Mode on mobile screens automatically flips horizontally to maximize canvas space.
- **Follower Mode:** Verified that students correctly use `roomInstance.setViewMode(ViewMode.Follower)` to ensure their viewport automatically tracks the teacher's actions.
- **Undo / Redo Serialization:**
  - `white-web-sdk` disables serialization by default for performance, which breaks the Undo/Redo stack.
  - **Crucial Fix:** Enabled `disableSerialization = false` **only for the teacher** (writable user). Enabling this for students (observers) crashes the SDK.
  - Bound UI buttons to `onCanUndoStepsUpdate` and `onCanRedoStepsUpdate` to visually disable empty actions.

### 2. Sentry Replay & False Positives
- **Third-Party Extensions:** Logged and ignored false positive errors (`TypeError: Cannot read properties of undefined (reading 'getReader')` and `ext:core/...`). These are caused by client-side browser extensions (e.g., ad blockers) crashing and clashing with Sentry's `rrweb` DOM recorder, not by Next.js application logic.

## 📖 Session Log & Recent Updates (Aug 25, 2026)

### 1. Infrastructure Access & Security (WSL & SSH)
- **Resolved SSH Access from WSL:** Diagnosed a `Permission denied (publickey)` error when attempting to access the DigitalOcean production server (`152.42.194.175`) from a local WSL (Ubuntu 22.04) environment.
- **Root Cause:** WSL operates with an isolated SSH key (`~/.ssh/id_ed25519`) distinct from the host Windows environment. 
- **Resolution:** Retrieved the WSL public key and manually appended it to the remote server's `~/.ssh/authorized_keys` file via an active PowerShell session, successfully granting WSL native, frictionless SSH access without disrupting existing host configurations or GitHub keys.

### 2. Technical CV Verification Protocol
- Established a step-by-step, manual testing protocol to definitively prove CV claims ("Fully deployed on DigitalOcean VPS" and "Moyasar-powered escrow payments") directly on the production server.
- **Server Identity:** Verified DigitalOcean hosting using `curl ipinfo.io/152.42.194.175`.
- **Async Queue:** Validated `QUEUE_CONNECTION=redis` in `.env.prod` to ensure robust, non-blocking background jobs (confirmed via `docker ps` showing the active `taj_queue_worker`).
- **Payment Readiness:** Verified production status by checking for `pk_live_` / `sk_live_` Moyasar API keys.
- **True Escrow Verification (SQL Tracking):** Detailed a practical database test using `docker exec -it job_mysql mysql -u taj_user -p`. By tracking the `wallets` table before and after a booking, we proved the "true escrow" logic: funds are deducted from the student's wallet immediately, held in escrow (platform), and only released to the teacher's wallet upon the session's completion (`status: Completed`), strictly differentiating it from a simple, immediate revenue split.
