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
