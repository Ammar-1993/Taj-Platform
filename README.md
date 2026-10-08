<div align="center">
  <a href="https://api.taj-edu.online/" target="_blank" title="Go to Taj Platform">
    <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f451.svg" alt="Taj Platform Logo" width="140" height="100" />
  </a>

  <br />
  <br />

  <h1>Taj Educational Platform <br/> (منصة تاج التعليمية)</h1>

  <p>
    <b>A Production-Grade, Arabic-First E-Learning Marketplace for Live 1-on-1 Tutoring.</b>
  </p>

  <p>
    <a href="#"><img src="https://img.shields.io/badge/Release-v2.3.0-emerald?style=for-the-badge&logo=git&logoColor=white" alt="Release v2.3.0" /></a>
    <a href="https://laravel.com"><img src="https://img.shields.io/badge/Laravel-12.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" /></a>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 15" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://openai.com"><img src="https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" /></a>
    <a href="https://filamentphp.com"><img src="https://img.shields.io/badge/Filament_V3-EAB308?style=for-the-badge&logo=filament&logoColor=white" alt="Filament" /></a>
    <a href="https://www.cloudflare.com"><img src="https://img.shields.io/badge/Cloudflare-R2_Storage-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare R2" /></a>
    <a href="https://www.agora.io"><img src="https://img.shields.io/badge/Agora-RTC%20%2F%20RTM-099DFD?style=for-the-badge&logo=agora&logoColor=white" alt="Agora" /></a>
    <a href="https://www.netless.link"><img src="https://img.shields.io/badge/Netless-Whiteboard-6C47FF?style=for-the-badge" alt="Netless Whiteboard" /></a>
    <a href="https://sentry.io"><img src="https://img.shields.io/badge/Sentry-Monitoring-362D59?style=for-the-badge&logo=sentry&logoColor=white" alt="Sentry" /></a>
    <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  </p>

  <p align="center" style="max-width: 800px; margin: 0 auto;">
    Taj connects students and parents in the MENA region with verified subject-specialist teachers for live, one-on-one tutoring. It ships with a fully-featured virtual classroom — HD video, adaptive screen sharing, and a real-time collaborative whiteboard — wrapped around a wallet-based economy with automated revenue splitting, built entirely with a native Arabic (RTL) experience.
  </p>
</div>

<br />

## 📖 Table of Contents

1. [🏗️ System Architecture](#️-system-architecture)
2. [⚡ Performance Benchmarks & Efficiency (v1.0 vs v2.0)](#-performance-benchmarks--efficiency-v10-vs-v20)
3. [🌐 Live Beta Access](#-live-beta-access)
4. [🆕 What's New](#-whats-new)
5. [✨ Key Features](#-key-features)
6. [🎓 Functional Requirements by Role](#-functional-requirements-by-role)
   - [🔄 Universal Authentication, Financial Ledger & Support Sequence](#-universal-authentication-financial-ledger--support-sequence)
   - [🔄 Student Discovery, Autonomous Booking & Classroom Attendance Sequence](#-student-discovery-autonomous-booking--classroom-attendance-sequence)
   - [🔄 Parent Account Governance, Escrow Funding & Supervision Sequence](#-parent-account-governance-escrow-funding--supervision-sequence)
   - [🔄 Teacher Lifecycle, Classroom Hosting & Settlement Sequence](#-teacher-lifecycle-classroom-hosting--earnings-settlement-sequence)
   - [🔄 Admin Super-User Governance & Operations Sequence](#-admin-super-user-governance--operations-sequence)
7. [🛠️ Technology Stack](#️-technology-stack)
8. [📊 Project Stats](#-project-stats)
9. [🚀 Getting Started](#-getting-started)
10. [🧪 Testing](#-testing)
11. [👤 Author](#-author)

---

## 🏗️ System Architecture

The platform operates on a high-performance decoupled monorepo architecture engineered for sub-second page loads, real-time media isolation, and financial integrity:

1. **Edge-Driven Presentation Layer**: Next.js 15 App Router & React 19 on Vercel combines **Edge React Server Components (RSC)** with multi-tier SWR caching (300s–600s with on-demand tag revalidation) for instant catalog rendering and dynamic OpenGraph SEO, alongside rich client-side state (TanStack Query) for authenticated interactive workflows.
2. **Direct-to-Cloud Real-Time Media (Zero Server Load)**: The virtual classroom (adaptive HD video, isolated screen sharing, and interactive Netless whiteboard) connects **directly, browser-to-cloud**, via Agora SD-RTN and Netless CDN — keeping the backend API 100% free of heavy media traffic and CPU load.
3. **Async Queue & WebRTC Token Pre-Provisioning**: A background Redis queue worker (`ProvisionVirtualClassroom`) pre-provisions whiteboard rooms and pre-generates Agora RTC/RTM tokens ahead of time, ensuring `< 1ms` instantaneous cold-join cache hits.
4. **ACID Financial Ledger & Escrow Economy**: MySQL 8.0 handles overdraft-proof wallet transactions and slot bookings with row-level locks (`lockForUpdate()`) and composite indexing (`idx_bookings_booked_by_status_date`), safely holding funds in escrow until lesson completion (80% teacher / 20% platform revenue split).
5. **Zero-Egress Cloud Object Storage & Edge Asset CDN**: Cloudflare R2 Object Storage (via S3-compatible API & `league/flysystem-aws-s3-v3`) hosts and streams all user profile avatars and teacher KYC verification credentials (national ID & degrees) through Cloudflare's global edge network with zero egress bandwidth fees, completely eliminating local disk coupling and enabling horizontal container scalability.
6. **Administrative Governance & Operations**: A fully localized FilamentPHP v3 dashboard empowers platform administrators with dynamic avatar customization, teacher KYC audits (national ID & degrees), dispute adjudication, abandoned booking resolution, and automated bank payout reconciliation.
7. **Multi-Tier Tagged Invalidation & Cloud Security**: Redis 7 cache tags with automated Eloquent lifecycle hooks (`saved`, `deleted`), Moyasar HMAC-signed webhooks, Google reCAPTCHA v3 bot protection, and full-stack Sentry APM observability.
8. **AI Guidance & Session Intelligence Engine**: OpenAI `gpt-4o-mini` integration with domain knowledge grounding ([`SupportKnowledgeBase`](backend/app/Services/SupportKnowledgeBase.php)), rate-limited REST API (`POST /api/v1/support/chat` with `throttle:15,1`), automated session summary generation, interactive quiz auto-grading, and dual human support escalation (WhatsApp `+967774344625` & Support Ticket `/dashboard/support`).


```mermaid
flowchart LR
    %% ─────────────────────────────────────────────────────────────
    %% 1. ACTORS & CLIENTS
    %% ─────────────────────────────────────────────────────────────
    subgraph ClientsCol ["👥 Users & Roles"]
        direction TB
        Student(["👨‍🎓 Student & Parent<br/>Web Portal & Classroom"])
        Teacher(["👩‍🏫 Verified Teacher<br/>Studio & Classroom Host"])
        Admin(["🛡️ Platform Admin<br/>Filament v3 Dashboard"])
    end

    %% ─────────────────────────────────────────────────────────────
    %% 2. PRESENTATION & REAL-TIME MEDIA EDGE
    %% ─────────────────────────────────────────────────────────────
    subgraph EdgeCol ["🌐 Presentation & Real-Time Edge"]
        direction TB
        Frontend["🖥️ <b>taj-frontend</b><br/>Next.js 15.3 • React 19<br/>Edge RSC • RTL Arabic<br/><code>Port 3000</code>"]
        Agora["📹 <b>Agora SD-RTN Cloud</b><br/>Adaptive HD Video / Audio<br/>Isolated Screen Share Channel"]
        Netless["🎨 <b>Netless Cloud</b><br/>Interactive Vector Whiteboard<br/>Real-Time Follower Mode"]
    end

    %% ─────────────────────────────────────────────────────────────
    %% 3. TAJ DOCKER BACKEND ECOSYSTEM
    %% ─────────────────────────────────────────────────────────────
    subgraph DockerApp ["🐳 Taj Docker Ecosystem (taj-net)"]
        direction TB

        subgraph GatewayTier ["1. API & WebSockets Gateway"]
            Backend["⚙️ <b>taj_admin_web</b><br/>Laravel 12 • PHP 8.3 FPM<br/>Sanctum Auth • Filament Panel"]
            Reverb["⚡ <b>taj_reverb</b> (WebSockets)<br/>Laravel Reverb • Port 8080<br/>Instant In-App Event Push"]
        end

        subgraph WorkerTier ["2. Asynchronous Background Engine"]
            QueueWorker["⚡ <b>taj_queue_worker</b><br/>Laravel Redis Daemon<br/>• Pre-provisioning (Agora & WB)<br/>• Escrow Releases & Refunds<br/>• AI Session Summaries"]
        end

        subgraph StorageTier ["3. Distributed State & Ledger"]
            Redis[("⚡ <b>taj_redis</b> (Redis 7)<br/>128MB • volatile-lru • AOF<br/>Queue Broker & Tagged Cache")]
            MySQL[("🐬 <b>taj_mysql</b> (MySQL 8.0)<br/>Double-Entry Escrow Ledger<br/>ACID Transactions & Bookings")]
        end
    end

    %% ─────────────────────────────────────────────────────────────
    %% 4. EXTERNAL CLOUD APIS & AI
    %% ─────────────────────────────────────────────────────────────
    subgraph CloudCol ["☁️ External Cloud & AI Services"]
        direction TB
        OpenAI["🧠 <b>OpenAI Cloud (gpt-4o-mini)</b><br/>24/7 AI Assistant • Summaries & Quizzes"]
        Moyasar["💳 <b>Moyasar Payment Gateway</b><br/>Mada, Visa, Apple Pay • Escrow Vault"]
        R2["☁️ <b>Cloudflare R2 Storage</b><br/>Zero-Egress Object Store & Edge CDN"]
        Recaptcha["🤖 <b>Google reCAPTCHA v3</b><br/>Risk Scoring & Bot Mitigation"]
        Sentry["📊 <b>Sentry APM</b><br/>Telemetry & Source Map Profiling"]
    end

    %% ── USER INGRESS FLOWS ──
    Student -->|HTTPS| Frontend
    Teacher -->|HTTPS| Frontend
    Admin -->|HTTPS Auth| Backend

    %% ── DIRECT BROWSER-TO-CLOUD STREAMS (ZERO SERVER LOAD) ──
    Frontend <-->|Direct WebRTC| Agora
    Frontend <-->|Direct WebSocket| Netless
    Frontend -.->|Edge CDN Avatars| R2

    %% ── FRONTEND TO BACKEND API & WEBSOCKETS ──
    Frontend -->|REST API v1 + Sanctum| Backend
    Frontend <-->|WebSockets Echo Push| Reverb

    %% ── BACKEND & STORAGE RELATIONSHIPS ──
    Backend <-->|Cache & Tokens| Redis
    Backend <-->|ACID Ledger| MySQL
    Backend -->|Dispatch Jobs| Redis
    Backend -->|Broadcast Events| Reverb
    Redis <-->|Scaling Pub/Sub| Reverb

    %% ── QUEUE WORKER CONSUMPTION ──
    Redis -->|Poll BLPOP| QueueWorker
    QueueWorker -->|Update State| MySQL
    QueueWorker -->|Pre-sign Tokens| Redis

    %% ── BACKEND & WORKER TO CLOUD INTEGRATIONS ──
    Backend -->|Live Support Chat| OpenAI
    QueueWorker -->|Generate Summaries| OpenAI
    Backend -->|Escrow Capture & Release| Moyasar
    Backend <-->|S3 Uploads & KYC Docs| R2
    Backend -.->|Score Check| Recaptcha
    Backend -.->|Server Telemetry| Sentry
    Frontend -.->|Client Errors| Sentry

    %% ── LUXURY MODERN COLOR PALETTE ──
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef edge fill:#022c22,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef gateway fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef worker fill:#1c1917,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef redis fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#f8fafc;
    classDef mysql fill:#042f2e,stroke:#14b8a6,stroke-width:2px,color:#f8fafc;
    classDef cloud fill:#18181b,stroke:#a1a1aa,stroke-width:1px,stroke-dasharray: 4 4,color:#f8fafc;
    classDef ai fill:#0c2a4a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;

    class Student,Teacher,Admin client;
    class Frontend,Agora,Netless edge;
    class Backend,Reverb gateway;
    class QueueWorker worker;
    class Redis redis;
    class MySQL mysql;
    class Moyasar,R2,Recaptcha,Sentry cloud;
    class OpenAI ai;
```



### 📋 Architecture & Data Flow Key

| Layer / Tier | Primary Technologies | Architectural Role & Implementation Details |
| :--- | :--- | :--- |
| **0. External Actors & Roles** | RBAC (Student, Teacher, Parent, Admin) | Distinct personas partitioned by Spatie RBAC, accessing tailored functional portals and localized Arabic RTL interfaces. |
| **1. Presentation & API Gateway Tier** | Next.js 15.3 App Router (React 19) & Laravel 12 API / Filament v3 / Laravel Reverb | Hybrid Edge architecture with React Server Components (RSC) and SWR caching on the frontend (`taj-frontend`); REST API v1 with Sanctum Bearer tokens and administrative KYC/dispute dashboard on the backend (`taj_admin_web`), paired with native high-throughput Laravel Reverb WebSockets (`taj_reverb` / port 8080) for instant event push (bookings, wallets, classroom presence). |
| **2. Asynchronous Queue & Background Worker Tier** | Laravel Queue Worker (`taj_queue_worker` / Redis) | Dedicated background CLI daemon executing `ProvisionVirtualClassroom` to pre-generate Agora RTC/RTM tokens and whiteboard rooms ahead of time, processing escrow releases and refund dispatches, and generating AI session summaries and quizzes via OpenAI. |
| **3. Distributed State, Caching & Database Tier** | MySQL 8.0 (`taj_mysql`) & Redis 7 (`taj_redis`) | InnoDB ACID financial ledger with composite indexing (`idx_bookings_booked_by_status_date`) and pessimistic row locking (`lockForUpdate()`), paired with tagged Redis caching (`Cache::tags()`), AOF disk persistence (`appendfsync everysec`), and eviction-proof financial queues via `volatile-lru`. |
| **Cloud Object Storage (Zero Egress)** | Cloudflare R2 Storage (`league/flysystem-aws-s3-v3`) | S3-compatible cloud bucket storing user profile avatars and teacher KYC documents (national ID & degrees) with direct CDN distribution, Livewire local staging, and zero bandwidth egress fees. |
| **Real-Time Media Cloud (Zero Server Load)** | Agora SD-RTN (RTC/RTM) & Netless Cloud | **Direct browser-to-cloud streams**: Real-time 720p/120p simulcast video, independent screen sharing channel (`UID + 1_000_000_000`), WebSocket signaling, and collaborative vector whiteboard canvas. |
| **Cloud SaaS & Security Integrations** | Moyasar + Google reCAPTCHA v3 + Sentry + OpenAI | Saudi-compliant payment escrow with HMAC-SHA256 signed webhooks, Google reCAPTCHA v3 bot protection, full-stack Sentry APM with automated production source maps, and OpenAI `gpt-4o-mini` for 24/7 grounded support chat, post-lesson summaries, and auto-graded quizzes. |

---

## ⚡ Performance Benchmarks & Efficiency (v1.0 vs. v2.0)

A comprehensive architectural overhaul transitioned Taj Educational Platform from **v1.0** to **v2.0**, introducing Next.js Edge React Server Components, atomic Redis token caching, composite database indexing, and query optimizations. The table below details the measurable performance gains, latency reductions, and efficiency improvements:

### 📈 Core Web Vitals & System Performance Comparison

| Layer / Metric | v1.0 (Before Optimization) | v2.0 (After Optimization) | Rate of Improvement / Impact |
| :--- | :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | `~1,850ms` (CSR waterfall + blocking Axios) | **`~420ms`** (Edge RSC pre-rendered HTML) | **🚀 ~77% faster** (Instant visual response) |
| **Largest Contentful Paint (LCP)** | `~2,600ms` (Delayed until client hydration) | **`~680ms`** (Instant teacher cards in HTML) | **🚀 ~74% faster** (Passes Google Core Web Vitals) |
| **Initial Client Network Requests** | 2 blocking HTTP requests on mount | **0 blocking client requests** (Edge SWR prefetch) | **🚀 100% elimination** of initial network waterfall |
| **Classroom Entry Latency (TTFB)** | `45ms – 75ms` (Synchronous HMAC signing on join) | **`< 1ms`** (Redis cache hit via pre-generation) | **🚀 ~98% latency drop** on session join |
| **Parent Dashboard (`/parent/dashboard`)** | `~180ms – 240ms` (4 sequential uncached queries) | **`12ms – 18ms`** (`Cache::tags(['parent_dashboard'])`) | **🚀 ~92% faster** response time |
| **Teacher Discovery Catalog** | Direct MySQL queries on each search | **Multi-tier Redis tagged cache** (`10m – 24h` TTL) | **🚀 ~85% reduction** in response time |
| **Booking Filter Execution Time** | `~15ms` (Full table scan on `booked_by_id`) | **`< 1.5ms`** (`idx_bookings_booked_by_status_date`) | **🚀 ~90% faster** query execution |
| **Database Read Load at Peak** | 100% direct database queries on catalog/schedule | **~68% reduction** in MySQL read queries | **🛡️ High resilience** against DB connection pool exhaustion |
| **Backend Test Coverage** | 69 passed (190 assertions) | **94 passed (283 assertions)** | **📈 +36% tests, +49% assertions** (100% passing) |
| **Frontend Test Coverage** | 28 passed across 5 suites | **33 passed across 5 suites** | **📈 +18% tests** (100% passing test suite) |

### 🔍 Architectural Drivers Behind the Performance Gains

1. **Next.js 15 & React 19 Hybrid RSC & Edge SWR Caching:**
   - Public pages (`/discovery/teachers`, `/`, etc.) were converted from client-side dynamic fetches to Edge React Server Components with `stale-while-revalidate` caching (`next: { revalidate: 60, tags: ['teachers'] }`).
   - HTML with full teacher profiles and catalog data is served instantly from the edge CDN, eliminating client loading spinners and waterfall network requests.
   - Dynamic OpenGraph and Twitter card metadata are now generated server-side for search engine crawlers and social sharing.

2. **WebRTC Token Decoupling & Background Pre-Provisioning:**
   - Moved HMAC token generation out of the user's synchronous HTTP join path into [`AgoraService`](backend/app/Services/AgoraService.php).
   - Background job `ProvisionVirtualClassroom` pre-generates Agora RTC and RTM tokens for student and teacher (plus screen-share tokens for teachers) 10 minutes before session start, storing them in Redis with a 110-minute TTL.
   - Users joining the virtual classroom experience a sub-millisecond cache hit instead of blocking on cryptographic calculations.

3. **Composite Database Indexing & Query Isolation:**
   - Created migration `idx_bookings_booked_by_status_date` indexing `(booked_by_id, status, booking_date)` to accelerate parent dashboard and calendar filters.
   - Resolved SQL operator precedence in `BookingController` by properly grouping `orWhere` clauses, preventing table scans and data leakage.
   - Restricted eager loading in `BookingController` to specific columns (`teacher:id,name,email`, `student:id,name,email`, etc.), avoiding over-fetching sensitive user attributes.

4. **Multi-Tier Tagged Redis Invalidation:**
   - Implemented `Cache::tags()` for discovery catalogs, grade levels, subjects, and parent dashboards with automatic Eloquent model lifecycle hooks (`saved`, `deleted`).
   - Dynamic cache invalidation ensures that data remains blazing fast without ever becoming stale when teachers update slots or parents book sessions.

---

## 🌐 Live Beta Access

- **🎓 Frontend (Students & Teachers)**: <a href="https://www.taj-edu.online/" target="_blank" rel="noopener noreferrer">Live Demo</a>
- **👑 Admin Dashboard Panel**: <a href="https://api.taj-edu.online/admin/login" target="_blank" rel="noopener noreferrer">Admin Login</a>
- **⚙️ Backend API Base URL**: <a href="https://api.taj-edu.online/" target="_blank" rel="noopener noreferrer">API Server</a>

---

## 🆕 What's New

### 🚀 Release v2.3.0 — Taj AI Support Assistant, AI Session Summaries & Automated Quizzes
- **🤖 Taj AI Support Assistant ("مساعد تاج الذكي")** — Engineered an interactive, 24/7 AI conversational support widget powered by OpenAI `gpt-4o-mini`, grounded in platform knowledge ([`SupportKnowledgeBase`](backend/app/Services/SupportKnowledgeBase.php)), rate-limited via `throttle:15,1` (`POST /api/v1/support/chat`), and styled with custom Markdown parsing and quick suggestion chips.
- **🚨 Dual Human Support Escalation Mechanism** — Implemented automatic intent detection for complex refunds and official complaints, instantly presenting users with direct WhatsApp support (`+967774344625`) and internal ticket routing (`/dashboard/support`).
- **📝 AI Session Summaries & Interactive Quizzes** — Integrated automated post-lesson AI session summary generation and auto-graded interactive quizzes ([`SessionSummaryController`](backend/app/Http/Controllers/Api/SessionSummaryController.php), [`SessionSummaryModal`](frontend/src/components/dashboard/ai/SessionSummaryModal.tsx), [`InteractiveQuiz`](frontend/src/components/dashboard/ai/InteractiveQuiz.tsx)).
- **🛡️ Production Container & UI Positioning Resilience** — Resolved fixed drawer layout geometry (`bottom-[88px] sm:bottom-24 z-[60]`), added active classroom route guards (`/classroom/*`), and updated GitHub Actions CI/CD with `--force-recreate` to ensure container freshness on production deployments.
- **🧪 100% Automated Test Suites Green** — Expanded test suite to **124 passing backend tests (400 assertions)** via PHPUnit and **40 passing frontend tests across 7 test suites** via Jest (100% passing).

### 🚀 Release v2.2.0 — Cloudflare R2 Cloud Storage, Dynamic Admin Avatar & Luxury Dashboard Polish
- **☁️ Cloudflare R2 Object Storage Integration** — Migrated user avatars, teacher national IDs, and academic certificates from local container storage to Cloudflare R2 via `league/flysystem-aws-s3-v3`, achieving S3-compatible zero-egress cloud storage and high-speed CDN delivery across MENA.
- **👑 Dynamic Admin Avatar & Profile Management** — Implemented dedicated administrative profile management (`/admin/profile`) allowing platform administrators to upload, preview, and update their personal avatars stored directly in Cloudflare R2, with automatic fallback to UI-Avatars.
- **💎 Modern Luxury Dashboard UI/UX** — Upgraded Filament admin dashboard widgets (`DashboardStats`, `FinancialOverview`, `LatestBookings`) with modern glassmorphism styling (`backdrop-filter: blur(12px)`), clickable deep-linking filters, clean minimalist descriptions, aligned widget heights, and eliminated visual clutter and redundant text.
- **🛡️ Livewire Staging & Security Hardening** — Configured Livewire temporary file upload staging to local disk before streaming to R2, whitelisted `blob:` worker sources and `*.cloudflarestorage.com` / `*.r2.dev` across production Nginx CSP and Next.js `remotePatterns`.
- **🧪 100% Automated Test Suite Green** — Expanded test coverage to **94 passing backend tests (283 assertions)** via PHPUnit and **33 passing frontend tests across 5 suites** via Jest (100% passing).

### 🚀 Release v2.1.0 — Next.js 15.3, React 19 Modernization & Administrative Governance
- **⚡ Next.js 15.3.9 & React 19.3.0 Major Upgrade** — Upgraded the entire frontend framework from Next.js 14 to Next.js 15.3.9 with React 19.3.0, leveraging React 19 compiler optimizations, modern client hooks, and stricter hydration validations.
- **🛡️ Custom React 19 Legacy Compatibility Shim for Whiteboard** — Engineered an architectural bridge ([`react19-legacy-compat.ts`](frontend/src/lib/react19-legacy-compat.ts) & [`React19CompatProvider.tsx`](frontend/src/components/providers/React19CompatProvider.tsx)) bridging `ReactDOM.render` to `createRoot` and deferring `unmountComponentAtNode` using `setTimeout(0)` to satisfy React 19's render-cycle invariants for `white-web-sdk`.
- **🔄 Async Request APIs Migration** — Upgraded all dynamic App Router routes ([`classroom/[id]`](frontend/src/app/classroom/[id]/page.tsx), [`teachers/[id]`](frontend/src/app/teachers/[id]/page.tsx), and [`reset-password`](frontend/src/app/reset-password/page.tsx)) to natively resolve `params: Promise<{ id: string }>` via `await` and `<Suspense>`.
- **🔇 Webpack BannerPlugin Noise Filter for Agora RTM** — Injected a module-level pre-evaluation filter in Webpack ([`next.config.mjs`](frontend/next.config.mjs)) to suppress expected dev-only noise codes (`-10015`, `-10023`, `assertRoomIsConnected`) before third-party SDK loggers capture `console.error`.
- **👑 Administrative Governance & Escrow Resolution** — Added Filament admin actions to resolve abandoned sessions (with instant escrow release to teachers or full wallet refunds to students/parents), unified resource actions into an ergonomic vertical-ellipsis `ActionGroup`, enhanced the User Wallet modal with comprehensive financial metrics, and integrated the royal crown brand logo.
- **🧪 100% Automated Test Suites Green** — Full test coverage with **89 backend tests (275 assertions)** via PHPUnit and **33 frontend tests across 5 suites** via Jest (100% passing).

### 🚀 Release v2.0.0 — Major Architecture & Performance Overhaul
- **⚡ Next.js 14 Hybrid RSC Architecture & Edge SWR** — Migrated public discovery and teacher catalog pages from pure client-side rendering to React Server Components with parallel edge pre-fetching (`stale-while-revalidate`), dropping FCP/LCP under 500ms and enabling dynamic OpenGraph SEO metadata previews.
- **🛡️ Dedicated Agora WebRTC Token Service & Atomic Redis Caching** — Encapsulated all RTC, RTM, and screen-sharing token lifecycles into [`AgoraService`](backend/app/Services/AgoraService.php) with channel-isolated cache keys and a 110-minute TTL safety margin, eliminating cold-join CPU bottlenecks.
- **⚡ Database Optimization & Tagged Redis Caching** — Added composite indexing on `bookings` (`idx_bookings_booked_by_status_date`), grouped nested SQL `orWhere` conditions, and cached read-heavy Parent and Teacher dashboard queries with automated Eloquent lifecycle invalidation.
- **🔄 On-Demand Edge Cache Invalidation** — Added `/api/revalidate` route handler with secret key authentication for instant edge cache purging upon backend catalog changes.
- **🧪 100% Automated Test Suite Green** — Full test coverage with 83 passing PHPUnit tests (248 assertions) and 28 frontend Jest tests.

---

Recent additions that take the platform beyond a basic booking-and-video app:

- **🖊️ Interactive Whiteboard** — A real-time collaborative whiteboard (Netless `white-web-sdk`) inside every classroom, with drawing tools, live cursor sync between teacher and student, undo/redo support, and automatic reconnection on network drops.
- **📡 Adaptive Network Resilience** — A multi-layer video quality system that smooths out network quality readings, switches to a low-resolution simulcast stream automatically, re-encodes the outgoing video in real time (from 720p down to 120p), and prioritizes audio over video when bandwidth is critically low — all without interrupting the call.
- **🖥️ Isolated Screen Sharing** — Screen share runs on a fully separate media connection from the camera feed, so presenting a slide deck never competes with — or degrades — the main video call.
- **🛰️ Full-Stack Error & Performance Monitoring** — Sentry is wired into both the Laravel backend and the Next.js frontend, with Source Maps uploaded on every Vercel production deploy for precise stack traces.
- **💰 Automated Revenue Split** — Every completed session automatically credits the teacher's wallet with their share (80%) and retains the platform commission — no manual reconciliation required.
- **🔒 Race-Condition-Safe Booking** — Atomic, database-transaction-locked slot reservation prevents double-booking even under concurrent requests.

---

## ✨ Key Features

- 🔐 **Full RBAC** — Four distinct roles (Student, Teacher, Parent, Admin) via Spatie Permissions, each with its own dashboard and capabilities.
- 📹 **Live HD Video Tutoring** — Low-latency audio/video sessions via Agora RTC, with automatic token renewal mid-session.
- 🖊️ **Real-Time Interactive Whiteboard** — Synchronized drawing, shapes, and text between teacher and student powered by Netless; teacher controls drawing tools, students follow in real time.
- 🖥️ **Dedicated Screen Sharing** — Independent media channel so screen shares stay smooth regardless of camera bandwidth.
- ☁️ **Cloudflare R2 Object Storage** — S3-compatible cloud storage for user profile avatars and sensitive teacher KYC verification documents with zero egress bandwidth fees and high-speed edge CDN delivery.
- 📅 **Race-Condition-Safe Booking** — Atomic, transaction-locked slot booking that makes double-booking the same time slot impossible.
- 💳 **Wallet-Based Economy** — A central wallet system for students, parents, and teachers, backed by an overdraft-proof transaction ledger.
- 💰 **Automated Payouts & Revenue Share** — Sessions automatically split earnings between teacher and platform on completion; teachers can request payouts to their bank account.
- 💵 **Moyasar Payment Integration** — Saudi-market payment gateway for wallet top-ups, with signed webhook verification and idempotent crediting.
- 👨‍👩‍👧 **Parent-Managed Sub-Accounts** — Parents can link multiple children, fund their wallets, and toggle independent booking permissions per child.
- ⭐ **Mandatory Review System** — Students are prompted to rate their teacher after every completed session.
- 👑 **Custom Admin Panel & Profile Customization** — A fully Arabic-localized FilamentPHP dashboard with dynamic admin avatar uploads, KYC verification, dispute resolution, refunds, and platform-wide analytics.
- 🤖 **Taj AI Support Assistant ("مساعد تاج الذكي")** — Interactive 24/7 AI chatbot powered by OpenAI `gpt-4o-mini`, grounded in domain knowledge, with dual human support escalation (WhatsApp `+967774344625` & Support Ticket `/dashboard/support`).
- 📝 **AI Session Summaries & Quizzes** — Automated post-lesson AI session summary generation and auto-graded interactive quizzes with role-tailored student/teacher view permissions.
- 🌍 **100% Arabic, RTL-Native UI** — Every screen, label, and system notification is built RTL-first for the MENA region.
- 🛰️ **Production-Grade Monitoring** — Sentry error tracking and performance tracing across both frontend and backend, with Source Maps for precise stack traces.

---

## 🎓 Functional Requirements by Role

### 🌐 Common Features (All Users)

- Secure, token-based authentication (Laravel Sanctum) with rate-limited login/registration.
- Role-aware dashboards summarizing schedules, wallet balance, and notifications.
- Full transaction history for every wallet movement (top-ups, deductions, earnings, refunds).
- Native RTL Arabic interface throughout.

#### 🔄 Universal Authentication, Financial Ledger & Support Sequence

The sequence diagram below illustrates the shared core operational workflows executed across all authenticated personas (Students, Parents, and Teachers) on Taj Educational Platform: Throttled Laravel Sanctum Token Authentication, Role-Aware Session Hydration & Real-Time RTL UI State, Centralized Wallet Ledger & Transaction History, Real-Time Notification Polling & Read Mutation, Customer Support Ticketing, and Secure Token Revocation on Logout.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'fontSize': '15px',
    'primaryTextColor': '#F8FAFC',
    'lineColor': '#64748B',
    'actorBkg': '#1E293B',
    'actorBorder': '#475569',
    'actorTextColor': '#F8FAFC',
    'signalColor': '#64748B',
    'signalTextColor': '#F8FAFC',
    'noteBkgColor': '#1E293B',
    'noteBorderColor': '#475569',
    'noteTextColor': '#F8FAFC',
    'activationBkgColor': '#334155',
    'activationBorderColor': '#64748B'
  }
}}%%
sequenceDiagram
    autonumber
    actor User as 👤 Platform User (Any Role)
    participant FE as 💻 Next.js Client App (RTL Arabic)
    participant API as 🔌 Laravel REST API
    participant DB as 🗄️ MySQL (InnoDB Ledger)
    participant Redis as ⚡ Redis (Rate Limit & Cache)
    participant Cloudflare as ☁️ Cloudflare R2 Storage
    participant Support as 🎧 Support & Notifications

    Note over User,Redis: ── 1. Throttled Authentication & Sanctum Token Issuance ──
    User->>FE: Enter Credentials (Email & Password)
    FE->>API: POST /api/v1/auth/login {email, password}
    API->>Redis: Check Rate Limiter (throttle:login)
    alt Exceeded 5 Failed Attempts
        API-->>FE: 429 Too Many Requests (Lockout for 60 seconds)
    else Valid Credentials
        API->>DB: SELECT user FROM users WHERE email = ?
        API->>DB: Hash::check(password, user.password)
        API->>DB: UPDATE users SET last_login_at = now(), last_login_ip = ip
        API->>DB: INSERT INTO personal_access_tokens (Sanctum Token)
        API-->>FE: 200 OK {token, user: {id, name, roles, wallet}}
        FE->>FE: Store token in secure storage and set Axios Authorization header
    end

    Note over User,Cloudflare: ── 2. Session Hydration & Cloud-Hosted Avatar Storage ──
    FE->>API: GET /api/v1/auth/me (Bearer Token)
    API->>DB: Eager load user roles, permissions and role profiles
    API-->>FE: 200 OK (Hydrate client role state and Arabic RTL UI)
    opt Profile Avatar Upload & Edge CDN Delivery
        User->>FE: Select New Profile Avatar (Image File)
        FE->>API: POST /api/v1/profile/avatar (Multipart Form)
        API->>Cloudflare: Stream image to Cloudflare R2 Bucket (avatars/{hash}.webp)
        Cloudflare-->>API: 200 OK (Public Edge CDN URL)
        API->>DB: UPDATE users SET avatar_url = r2_public_url
        API-->>FE: 200 OK {avatar_url}
        FE-->>User: Instant Profile Avatar Display via Edge CDN
    end
    User->>FE: Open Wallet Screen (/wallet)
    FE->>API: GET /api/v1/wallet?type=&page=1
    API->>DB: SELECT balance FROM wallets WHERE user_id = user.id
    API->>DB: SELECT transactions FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC
    API-->>FE: 200 OK {balance, transactions: [deposits, withdrawals, earnings, refunds]}

    Note over User,Support: ── 3. Notification Polling & Read Status Mutation ──
    Note over Support,DB: System events (bookings, payouts, escrow) dispatch Database Notifications
    FE->>API: GET /api/v1/notifications (Unread alerts)
    API->>DB: SELECT notifications WHERE notifiable_id = user.id AND read_at IS NULL
    API-->>FE: 200 OK (Unread notification count and badge list)
    User->>FE: Click on notification item
    FE->>API: POST /api/v1/notifications/{id}/read
    API->>DB: UPDATE notifications SET read_at = now() WHERE id = ?
    API-->>FE: 200 OK {status: 'success'}

    Note over User,DB: ── 4. Customer Support Ticketing & Secure Session Termination ──
    opt Submit Customer Support Ticket
        User->>FE: Fill Support Request (Subject, Description, optional booking_id)
        FE->>API: POST /api/v1/support-tickets {subject, description, booking_id}
        API->>DB: INSERT INTO support_tickets (user_id, status: 'open')
        API-->>FE: 201 Created (Ticket submitted for support team investigation)
    end
    User->>FE: Click "Logout"
    FE->>API: POST /api/v1/auth/logout
    API->>DB: DELETE FROM personal_access_tokens WHERE id = currentAccessToken.id
    API-->>FE: 200 OK (Session invalidated successfully)
    FE->>FE: Purge local storage and reset TanStack Query cache
```

---

### 👨‍🎓 Student Features

- Search and filter teachers by subject, grade level, and availability.
- Book a session directly from a teacher's live calendar, paid instantly from wallet balance.
- Join a live classroom with video, audio, screen sharing, and the interactive whiteboard — no external app required.
- Rate and review the teacher after each completed session.

#### 🔄 Student Discovery, Autonomous Booking & Classroom Attendance Sequence

The sequence diagram below illustrates the end-to-end operational journey of a Student on Taj Educational Platform: High-speed Next.js Edge Server Component discovery, race-condition-safe autonomous slot booking with escrow wallet deduction, sub-millisecond classroom entry with Agora WebRTC and Netless whiteboard follower synchronization, independent screen share reception, and mandatory post-session atomic review submission.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'fontSize': '15px',
    'primaryTextColor': '#F8FAFC',
    'lineColor': '#64748B',
    'actorBkg': '#1E293B',
    'actorBorder': '#475569',
    'actorTextColor': '#F8FAFC',
    'signalColor': '#64748B',
    'signalTextColor': '#F8FAFC',
    'noteBkgColor': '#1E293B',
    'noteBorderColor': '#475569',
    'noteTextColor': '#F8FAFC',
    'activationBkgColor': '#334155',
    'activationBorderColor': '#64748B'
  }
}}%%
sequenceDiagram
    autonumber
    actor Student as 👨‍🎓 Student
    participant FE as 💻 Next.js Client App (Edge RSC)
    participant API as 🔌 Laravel REST API
    participant DB as 🗄️ MySQL (InnoDB Ledger)
    participant Redis as ⚡ Redis (Tags & Tokens)
    participant Agora as 📹 Agora SD-RTN / RTM
    participant Netless as 🖊️ Netless Whiteboard
    actor Teacher as 👨‍🏫 Teacher

    Note over Student,Redis: ── 1. Edge Catalog Discovery & Real-Time Slot Exploration ──
    Student->>FE: Browse Teachers by Subject & Grade (/discovery/teachers)
    FE->>Redis: Next.js Edge Server Component (SWR Cache revalidate: 60s)
    Note over FE,Redis: Sub-second Server-Rendered HTML (Zero initial client waterfall)
    Student->>FE: Open Teacher Profile & Select Date
    FE->>API: GET /api/v1/discovery/teachers/{id}/slots
    API->>Redis: Cache::tags(['teacher_slots'])->remember(15m TTL)
    API-->>FE: 200 OK (Available bookable slots)

    Note over Student,Teacher: ── 2. Autonomous Escrow Booking & Race-Condition Safe Lock ──
    Student->>FE: Click "Book Slot" (Apply Promo Code optional)
    FE->>API: POST /api/v1/bookings {teacher_slot_id, promo_code}
    critical Atomic Database Transaction (Pessimistic Locking)
        API->>DB: SELECT slot FROM teacher_slots FOR UPDATE
        API->>DB: Check slot.status is available
        API->>DB: Validate student wallet balance covers net_paid
        API->>DB: WalletService::processTransaction(student, -net_paid, 'withdrawal')
        API->>DB: INSERT INTO bookings (student_id, teacher_id, net_paid, status: 'scheduled')
        API->>DB: UPDATE teacher_slots SET status = 'booked'
    end
    API->>Redis: Queue::dispatch(ProvisionVirtualClassroom)
    API->>Teacher: Dispatch NewBookingNotification & BookingCreated event
    API->>Redis: Invalidate Cache::tags(['teacher_slots', 'teachers'])
    API-->>FE: 201 Created (Booking confirmed and slot locked)

    Note over Student,Netless: ── 3. Live Classroom Entry & Follower Whiteboard Sync ──
    Note over Redis,API: Pre-provisioned Agora RTC/RTM tokens & Netless room cached (110m TTL)
    Student->>FE: Click "Enter Classroom" (/classroom/[id])
    FE->>API: GET /api/v1/bookings/{id}/classroom
    API->>DB: Atomically set student_joined_at = now()
    API->>Redis: Fetch pre-generated student tokens (RTC, RTM, Netless Reader Token)
    Note over API,Redis: Sub-millisecond Cache Hit (under 1ms)
    API-->>FE: 200 OK (agora_channel, uid, tokens, whiteboard reader payload)

    par Real-Time Media Initialization
        FE->>Agora: Join RTC Channel as Host (Adaptive video & mic)
        Agora-->>Teacher: Stream student audio & webcam feed
    and Netless Follower Mode Whiteboard
        FE->>Netless: Join Whiteboard as Reader (roomInstance.setViewMode(Follower))
        Netless-->>FE: Synchronize teacher drawing strokes (disableSerialization = true for observer)
    and Real-Time Signaling & Visibility Sync
        FE->>Agora: Connect RTM Channel (Listen for 'whiteboard_toggle')
        Agora-->>FE: Teacher toggles whiteboard -> Auto-flip visibility
    end

    loop Every 30 Seconds
        FE->>API: POST /api/v1/bookings/{id}/heartbeat (last_heartbeat_at = now())
        API-->>FE: 200 OK
    end

    opt Receive Teacher Screen Share
        Agora-->>FE: Teacher publishes on screen UID (teacherUid + 1,000,000,000)
        FE-->>Student: Display high-resolution screen share in independent canvas
    end

    Note over Student,DB: ── 4. Session Conclusion & Atomic Teacher Rating Update ──
    Teacher->>API: PATCH /api/v1/bookings/{id}/complete (status: 'completed')
    FE-->>Student: Prompt "Rate your experience with Teacher"
    Student->>FE: Submit Rating (1-5 Stars) & Feedback Comment
    FE->>API: POST /api/v1/reviews {booking_id, rating: 5, comment: 'ممتاز جداً'}
    critical Atomic Review & Rating Calculation (Row Locking)
        API->>DB: Verify booking completed and user is authorized student
        API->>DB: INSERT INTO reviews (booking_id, student_id, teacher_id, rating: 5)
        API->>DB: SELECT profile FROM teacher_profiles FOR UPDATE
        API->>DB: Recalculate average_rating and increment reviews_count
    end
    API->>Redis: Invalidate Cache::tags(['teachers', 'discovery'])
    API-->>FE: 200 OK (Review recorded and teacher public rating updated)
```

---

### 👨‍👩‍👧‍👦 Parent Features

- Create and manage multiple linked child (student) accounts.
- Top up the family wallet via Moyasar and allocate spending allowances per child.
- Grant or revoke a child's ability to book and pay for sessions independently.
- Monitor a child's schedule, attendance, and the reviews they've left.

#### 🔄 Parent Account Governance, Escrow Funding & Supervision Sequence

The sequence diagram below illustrates the end-to-end operational workflows executed by a Parent on Taj Educational Platform: Child Sub-Account Provisioning & Permission Control, Moyasar Escrow Wallet Top-Up & Idempotent Crediting, Proxy Booking on Behalf of Children with Pessimistic Locking, High-Performance Dashboard Telemetry Caching, and 24-Hour Prior Cancellation with Automated Escrow Refunds.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'fontSize': '15px',
    'primaryTextColor': '#F8FAFC',
    'lineColor': '#64748B',
    'actorBkg': '#1E293B',
    'actorBorder': '#475569',
    'actorTextColor': '#F8FAFC',
    'signalColor': '#64748B',
    'signalTextColor': '#F8FAFC',
    'noteBkgColor': '#1E293B',
    'noteBorderColor': '#475569',
    'noteTextColor': '#F8FAFC',
    'activationBkgColor': '#334155',
    'activationBorderColor': '#64748B'
  }
}}%%
sequenceDiagram
    autonumber
    actor Parent as 👨‍👩‍👧 Parent
    participant FE as 💻 Next.js Client App
    participant API as 🔌 Laravel REST API
    participant Gateway as 💳 Moyasar Gateway
    participant DB as 🗄️ MySQL (InnoDB Ledger)
    participant Redis as ⚡ Redis (Tags & Cache)
    actor Child as 👨‍🎓 Child (Student)
    actor Teacher as 👨‍🏫 Teacher

    Note over Parent,Child: ── 1. Child Sub-Account Provisioning & Permission Control ──
    Parent->>FE: Add Child (Name, Email, Password, Grade Level)
    FE->>API: POST /api/v1/parent/children {name, email, password, grade_level_id}
    critical DB Transaction: Atomic Child Account Creation
        API->>DB: INSERT INTO users (parent_id, role: student)
        API->>DB: INSERT INTO wallets (user_id: child, balance: 0.00)
        API->>DB: INSERT INTO student_profiles (grade_level_id, can_book_independently: false)
    end
    API->>Redis: Invalidate Cache::tags(['parent_dashboard', 'parent_{id}'])
    API-->>FE: 201 Created (Child account linked and configured)
    opt Toggle Autonomous Booking Permission
        Parent->>FE: Toggle "Allow Independent Booking"
        FE->>API: PATCH /api/v1/parent/children/{id}/toggle-permission
        API->>DB: UPDATE student_profiles SET can_book_independently = true/false
        API->>Redis: Invalidate Cache::tags(['parent_dashboard', 'parent_{id}'])
        API-->>FE: 200 OK (Booking permission updated)
    end

    Note over Parent,Gateway: ── 2. Moyasar Wallet Top-Up & Idempotent Crediting ──
    Parent->>FE: Enter Top-Up Amount (e.g. 500 SAR)
    FE->>API: POST /api/v1/payments/create {amount: 500}
    API->>Gateway: POST /v1/invoices {amount: 50000, metadata: {user_id, type: 'wallet_topup'}}
    Gateway-->>API: 200 OK {invoice_id, checkout_url}
    API-->>FE: Return checkout_url
    Parent->>Gateway: Complete Payment (Mada / Visa 3D-Secure OTP)
    Gateway->>API: Signed Webhook (HMAC-SHA256): payment_completed
    critical Atomic Wallet Deposit (Idempotency Guard)
        API->>DB: Check if invoice transaction already processed
        API->>DB: UPDATE wallets SET balance = balance + 500 WHERE user_id = parent
        API->>DB: INSERT INTO wallet_transactions (type: deposit, amount: 500)
    end
    API->>Redis: Invalidate Cache::tags(['parent_dashboard', 'parent_{id}'])
    API-->>Gateway: 200 OK (Webhook Acknowledged)
    FE->>API: POST /api/v1/payments/verify {id: invoice_id}
    API-->>FE: 200 OK (Live parent balance updated)

    Note over Parent,Teacher: ── 3. Proxy Booking & Escrow Deduction on Behalf of Child ──
    Parent->>FE: Select Subject, Teacher & Slot for Child
    FE->>API: POST /api/v1/bookings {teacher_slot_id, child_id, promo_code}
    critical Atomic Slot Reservation & Escrow Deduction (Pessimistic Locking)
        API->>DB: SELECT slot FROM teacher_slots FOR UPDATE
        API->>DB: Verify parent wallet balance covers net_paid
        API->>DB: WalletService::processTransaction(parent, -net_paid, 'withdrawal')
        API->>DB: INSERT INTO bookings (student_id: child, booked_by_id: parent, status: 'scheduled')
        API->>DB: UPDATE teacher_slots SET status = 'booked'
    end
    API->>Redis: Queue::dispatch(ProvisionVirtualClassroom)
    API->>Teacher: Dispatch NewBookingNotification & BookingCreated event
    API->>Redis: Invalidate Cache::tags(['teacher_slots', 'parent_dashboard', 'parent_{id}'])
    API-->>FE: 201 Created (Booking confirmed with student assigned to child)

    Note over Parent,DB: ── 4. Dashboard Telemetry & 24h Cancellation Refund ──
    Parent->>FE: Open Parent Dashboard (/parent/dashboard)
    FE->>API: GET /api/v1/parent/dashboard?page=1
    API->>Redis: Fetch cached telemetry (Cache::tags(['parent_dashboard', 'parent_{id}']))
    Note over API,Redis: Sub-20ms Tagged Cache Hit (Aggregated spending & children schedules)
    API->>DB: Live read parent wallet balance (bypasses cache for real-time accuracy)
    API-->>FE: 200 OK {total_spent, bookings, wallets, parent_balance}
    opt 24-Hour Prior Cancellation & Escrow Refund
        Parent->>FE: Click "Cancel Session"
        FE->>API: PATCH /api/v1/bookings/{id}/cancel
        API->>DB: Verify session start time is at least 24 hours in future
        critical Atomic Cancellation & Escrow Refund
            API->>DB: SELECT booking FOR UPDATE
            API->>DB: UPDATE bookings SET status = 'cancelled'
            API->>DB: UPDATE teacher_slots SET status = 'available'
            API->>DB: WalletService::processTransaction(parent, +net_paid, 'refund')
        end
        API->>Redis: Invalidate Agora RTC/RTM & Netless room tokens
        API->>Redis: Invalidate Cache::tags(['parent_dashboard', 'teacher_slots'])
        API-->>FE: 200 OK (Full refund credited back to parent wallet)
    end
```

---

### 👨‍🏫 Teacher Features

- Complete KYC onboarding by uploading identification and academic credentials for admin verification.
- Manage a weekly availability calendar for bookable slots.
- Host the virtual classroom: video, screen sharing, and full whiteboard drawing control.
- Automatically receive 80% of each session's payment directly into their wallet upon marking it complete, with the option to request payouts to a bank account.

#### 🔄 Teacher Lifecycle, Classroom Hosting & Earnings Settlement Sequence

The sequence diagram below illustrates the end-to-end operational lifecycle of a Teacher on Taj Educational Platform: KYC profile verification, availability slot management, sub-millisecond virtual classroom entry via pre-generated WebRTC and Netless tokens, independent screen sharing, mid-session silent token renewal, atomic 80% escrow earnings release, and bank payout requests.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'fontSize': '15px',
    'primaryTextColor': '#F8FAFC',
    'lineColor': '#64748B',
    'actorBkg': '#1E293B',
    'actorBorder': '#475569',
    'actorTextColor': '#F8FAFC',
    'signalColor': '#64748B',
    'signalTextColor': '#F8FAFC',
    'noteBkgColor': '#1E293B',
    'noteBorderColor': '#475569',
    'noteTextColor': '#F8FAFC',
    'activationBkgColor': '#334155',
    'activationBorderColor': '#64748B'
  }
}}%%
sequenceDiagram
    autonumber
    actor Teacher as 👨‍🏫 Teacher
    participant FE as 💻 Next.js Client App
    participant API as 🔌 Laravel REST API
    participant Cloudflare as ☁️ Cloudflare R2 Storage
    participant DB as 🗄️ MySQL (InnoDB Ledger)
    participant Redis as ⚡ Redis (Tokens & Cache)
    participant Agora as 📹 Agora SD-RTN / RTM
    participant Netless as 🖊️ Netless Whiteboard
    actor Student as 👨‍🎓 Student

    Note over Teacher,API: ── 1. KYC Profile Submission & Availability Scheduling ──
    Teacher->>FE: Complete Profile (Bio, Subject, National ID, Degree)
    FE->>API: POST /api/v1/profile/teacher (Multipart Form)
    API->>Cloudflare: Stream Documents to Cloudflare R2 Bucket (kyc-documents/{id})
    Cloudflare-->>API: 200 OK (S3 Keys & Direct CDN Links)
    API->>DB: UPDATE teacher_profiles (is_verified = false, docs saved)
    Note over API,DB: Awaits Admin Verification via Filament Dashboard
    API-->>FE: 200 OK (Under Review)
    Teacher->>FE: Publish Available Slots (Date & Time Window)
    FE->>API: POST /api/v1/teacher/slots {slot_date, start_time, end_time}
    API->>DB: Check Overlaps & INSERT teacher_slots (status: available)
    API->>Redis: Invalidate Cache::tags(['teacher_slots', 'teacher_{id}'])
    API-->>FE: 201 Created (Slots live on public booking calendar)

    Note over Teacher,Student: ── 2. Live Classroom Entry & Zero-Latency Media Connect ──
    Note over Redis,API: Booking confirmed & provisioned in advance by ProvisionVirtualClassroom job
    Teacher->>FE: Click "Join Classroom" (/classroom/[id])
    FE->>API: GET /api/v1/bookings/{id}/classroom
    API->>DB: Atomically set teacher_joined_at = now(), status = in_progress
    API->>Redis: Fetch pre-generated tokens (RTC, RTM, Screen, Whiteboard Admin)
    Note over API,Redis: Sub-millisecond Cache Hit (under 1ms)
    API-->>FE: 200 OK (agora_channel, uid, tokens, whiteboard payload)

    par Real-Time Media Initialization
        FE->>Agora: Join RTC Channel as Host (Adaptive 720p/120p video & mic)
        Agora-->>Student: Low-latency audio & video stream
    and Whiteboard Canvas Initialization
        FE->>Netless: Join Whiteboard as Admin (disableSerialization = false)
        Netless-->>Student: Synchronize live drawing strokes & cursor
    and RTM Signaling & State Sync
        FE->>Agora: Connect RTM Channel (Broadcast 'whiteboard_toggle')
        Agora-->>Student: Synchronize UI state & canvas visibility
    end

    loop Every 30 Seconds
        FE->>API: POST /api/v1/bookings/{id}/heartbeat (last_heartbeat_at = now())
        API-->>FE: 200 OK
    end

    Note over Teacher,Agora: ── 3. Dedicated Screen Sharing & Mid-Session Token Refresh ──
    Teacher->>FE: Toggle "Share Screen"
    FE->>Agora: Publish screen capture on dedicated UID (teacherUid + 1,000,000,000)
    Note over FE,Agora: Dual-stream enabled (480p low / 1080p high) - isolated from webcam track
    Agora-->>Student: Receive dedicated screen sharing track

    opt Mid-Session Silent Token Renewal (Expiry Callback)
        FE->>API: GET /api/v1/bookings/{id}/refresh-token
        API->>Redis: AgoraService::refreshTokens(channel, uid, isTeacher: true)
        API-->>FE: 200 OK (fresh RTC & Screen tokens)
        FE->>Agora: client.renewToken(token) & screenClient.renewToken(screenToken)
    end

    Note over Teacher,DB: ── 4. Session Completion, 80% Revenue Release & Payout ──
    Teacher->>FE: Click "Complete Lesson"
    FE->>API: PATCH /api/v1/bookings/{id}/complete
    critical Atomic Database Transaction (Pessimistic Locking)
        API->>DB: SELECT booking FOR UPDATE
        API->>DB: UPDATE bookings SET status = 'completed', completed_at = now()
        Note over API: Calculate 80% teacher revenue / 20% platform commission
        API->>DB: WalletService::processTransaction(teacher, +80%, 'class_earnings')
    end
    API-->>FE: 200 OK (Wallet balance credited immediately)
    Teacher->>FE: Submit Bank Payout Request (Amount min 50 SAR, Bank Name, IBAN)
    FE->>API: POST /api/v1/wallet/payouts {amount, bank_name, iban}
    API->>DB: Withhold amount & INSERT payout_requests (status: pending)
    API-->>FE: 201 Created (Payout request logged for Admin wire transfer audit)
```
---

### 🛡️ Admin (Super User) Features

- Review and verify (or reject) teacher KYC applications.
- Full visibility into all bookings, users, and platform-wide revenue — with retained platform commission tracked automatically.
- Process teacher payout requests and issue manual refunds.
- Manage the subject and grade-level catalog available across the platform.
- Monitor system health and error rates via the integrated Sentry dashboard.

#### 🔄 Admin Super-User Governance & Operations Sequence

The sequence diagram below illustrates the administrative workflows executed by Platform Administrators through the FilamentPHP v3 dashboard: Teacher KYC Verification & Edge Catalog Propagation, Dispute Resolution & Atomic Escrow Refund Override, and Teacher Payout Reconciliation.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'fontSize': '15px',
    'primaryTextColor': '#F8FAFC',
    'lineColor': '#64748B',
    'actorBkg': '#1E293B',
    'actorBorder': '#475569',
    'actorTextColor': '#F8FAFC',
    'signalColor': '#64748B',
    'signalTextColor': '#F8FAFC',
    'noteBkgColor': '#1E293B',
    'noteBorderColor': '#475569',
    'noteTextColor': '#F8FAFC',
    'activationBkgColor': '#334155',
    'activationBorderColor': '#64748B'
  }
}}%%
sequenceDiagram
    autonumber
    actor Admin as 👑 Admin (Super User)
    participant Filament as 🖥️ Filament v3 Panel
    participant Cloudflare as ☁️ Cloudflare R2 Storage
    participant Service as ⚙️ Backend Services
    participant DB as 🗄️ MySQL (InnoDB Ledger)
    participant Redis as ⚡ Redis (Tags & Cache)
    participant Edge as 🌐 Next.js Edge (Vercel)
    actor Teacher as 👨‍🏫 Teacher
    actor Student as 👨‍🎓 Student

    Note over Admin,Edge: ── 1. Teacher KYC Verification & Edge Catalog Propagation ──
    Admin->>Filament: Inspect KYC application (National ID & Degree)
    Filament->>Cloudflare: Fetch Verified Documents via CDN URL (TeacherProfileResource)
    Cloudflare-->>Filament: Stream High-Resolution KYC Document Cards
    Admin->>Filament: Click "Approve Teacher" (is_verified = true)
    Filament->>DB: UPDATE teacher_profiles SET is_verified = true
    Note over DB,Redis: Eloquent booted() lifecycle hook triggers
    DB->>Redis: Cache::tags(['teachers', 'discovery'])->flush()
    Filament->>Edge: POST /api/revalidate {tag: 'teachers', secret: KEY}
    Edge-->>Filament: 200 OK (Edge SWR Cache Purged)
    Filament-->>Admin: Success: Teacher instantly live in public search catalog

    Note over Admin,Student: ── 2. Dispute Resolution & Atomic Escrow Refund Override ──
    Student->>Filament: Submit dispute / attendance grievance
    Admin->>Filament: Open BookingResource -> Click "Force Cancel & Refund"
    Filament->>Service: BookingService::cancelBooking(booking, adminUser)
    critical Atomic Database Transaction (Pessimistic Locking)
        Service->>DB: SELECT booking FOR UPDATE
        Service->>DB: UPDATE bookings SET status = 'cancelled'
        Service->>DB: UPDATE teacher_slots SET status = 'available'
        Service->>DB: WalletService::processTransaction(payer, +net_paid, 'refund')
    end
    Service->>Redis: AgoraService::invalidateTokens(channel, teacher, student)
    Service->>Redis: Invalidate Whiteboard Tokens (admin, reader)
    Service->>Student: Dispatch Refund Notification & Update Balance
    Service-->>Filament: Return Cancelled & Refunded Status
    Filament-->>Admin: Alert: "Full refund processed & slot restored to available"

    Note over Admin,Teacher: ── 3. Teacher Payout Audit & Settlement Reconciliation ──
    Teacher->>Filament: Request bank withdrawal (from 80% earned balance)
    Admin->>Filament: Review PayoutRequestResource (Verify IBAN)
    alt Approved & Wire Transferred
        Admin->>Filament: Click "Mark as Transferred"
        Filament->>DB: UPDATE payout_requests SET status = 'transferred'
        Filament->>Teacher: Dispatch PayoutProcessedNotification
    else Rejected (Invalid IBAN / Non-Compliant)
        Admin->>Filament: Click "Reject & Refund" (Enter reason)
        Filament->>DB: UPDATE payout_requests SET status = 'rejected'
        Filament->>DB: WalletService::processTransaction(teacher, +amount, 'deposit')
        Filament->>Teacher: Dispatch Rejection Notification with Admin Reason
    end
    Filament-->>Admin: Payout lifecycle finalized & ledger balanced

    Note over Admin,Cloudflare: ── 4. Admin Profile Management & Dynamic Cloud Avatar ──
    opt Admin Profile & Avatar Customization
        Admin->>Filament: Access Profile Page (/admin/profile) & Select Image
        Filament->>Filament: Stage Upload via Local Temporary Disk (livewire.disk)
        Filament->>Cloudflare: Stream Image to Cloudflare R2 Bucket (avatars/{hash}.jpg)
        Cloudflare-->>Filament: 200 OK (Public Edge CDN URL)
        Filament->>DB: UPDATE users SET avatar_url = cdn_url WHERE id = admin.id
        Filament-->>Admin: Dynamic Avatar Live Across Admin Header & Welcome Widgets
    end
```

---

## 🛠️ Technology Stack

### Backend (`/backend`)

> **Core:** Laravel 12.0 • PHP 8.3 • MySQL 8.0
> **Admin & Security:** Filament V3 • Laravel Sanctum • Spatie Permission
> **Cloud Storage:** Cloudflare R2 Object Storage (`league/flysystem-aws-s3-v3`)
> **Real-Time & Media:** Agora RTC/RTM Token Generation • Netless Whiteboard REST API
> **Payments:** Moyasar Payment Gateway (SAR)
> **Async Processing:** Laravel Queues backed by **Redis** (Predis client)
> **AI & Intelligence Engine:** OpenAI API (`gpt-4o-mini`) • `SupportKnowledgeBase` grounding engine
> **Monitoring:** Sentry (`sentry/sentry-laravel`)
> **Testing:** PHPUnit via `php artisan test` — **124 tests, 400 assertions**

### Frontend (`/frontend`)

> **Core:** Next.js 15.3 (App Router) • React 19.3 • TypeScript 5 (strict mode)
> **Styling & UI:** Tailwind CSS 3.4 • Lucide React icons
> **Live Classroom:** `agora-rtc-sdk-ng` (video/audio/screen share) • `agora-rtm-sdk` (cursor & event sync) • `white-web-sdk` (interactive whiteboard with React 19 compatibility shim)
> **AI Support & Data:** Taj AI Support Assistant widget • TanStack Query (React Query) • Axios
> **Monitoring:** `@sentry/nextjs` with Source Maps
> **Testing:** Jest + React Testing Library — **40 tests across 7 test suites**

---

## 📊 Project Stats

| Metric                   | Details                                                          |
| :------------------------ | :--------------------------------------------------------------- |
| **🚀 Architecture**       | Monorepo (Next.js frontend + Laravel REST API)                   |
| **🔐 Role Support**       | Admin, Teacher, Student, Parent                                  |
| **🤖 AI Capabilities**    | 24/7 AI Support Assistant + AI Session Summaries & Quizzes       |
| **☁️ Cloud Storage**     | Cloudflare R2 (S3 API) — zero egress fees & edge CDN             |
| **📡 Video/Audio**        | Agora RTC — adaptive bitrate, simulcast-enabled                  |
| **🖊️ Whiteboard**         | Netless `white-web-sdk` — real-time collaborative                |
| **💳 Payments**           | Moyasar (SAR, Saudi market) with webhook verification            |
| **🔁 Async Queue**        | Laravel Queue Worker backed by Redis                             |
| **🛰️ Monitoring**         | Sentry — full-stack (backend + frontend) with Source Maps        |
| **🌍 Localization**       | 100% Arabic (RTL-native interface)                               |
| **🛡️ Security**           | Sanctum tokens + Spatie RBAC + rate limiting                     |
| **🧪 Backend Tests**      | 124 tests · 400 assertions (PHPUnit)                             |
| **🧪 Frontend Tests**     | 40 tests · 7 suites (Jest + React Testing Library)               |
| **📦 Deployment**         | Backend → DigitalOcean VPS / Render · Frontend → Vercel          |

---

## 🚀 Getting Started

The recommended way to boot up the complete Taj Platform stack (Frontend, Backend, and Database) is using **Docker Compose**.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) v2+
- **Node.js 20+** (for local frontend development outside Docker)
- **PHP 8.3 & Composer** (for local backend development outside Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/Ammar-1993/Taj-Platform.git
cd Taj-Platform
```

### 2. Configure Backend Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in: 

| Variable | Purpose |
|---|---|
| `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | Database connection credentials |
| `FILESYSTEM_DISK` | Default storage driver (`s3` for Cloudflare R2 in production, `public` for local) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 S3-compatible API access token credentials |
| `AWS_DEFAULT_REGION` | Cloudflare R2 region (`auto`) |
| `AWS_BUCKET` | Cloudflare R2 bucket name (`taj-platform`) |
| `AWS_ENDPOINT` | Cloudflare R2 S3 API endpoint (`https://<account_id>.r2.cloudflarestorage.com`) |
| `AWS_URL` | Public CDN URL for Cloudflare R2 bucket (`https://<bucket-domain>.r2.dev`) |
| `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` | Agora credentials used to generate RTC/RTM tokens for the classroom |
| `WHITEBOARD_SDK_TOKEN` | Netless SDK token used to create whiteboard rooms and mint room tokens |
| `MOYASAR_PUBLISHABLE_KEY` / `MOYASAR_SECRET_KEY` / `MOYASAR_WEBHOOK_SECRET` | Moyasar payment gateway credentials and webhook signature verification |
| `FRONTEND_URL` | Used for CORS and for building Moyasar payment redirect URLs |
| `QUEUE_CONNECTION` | Set to `redis` for production-grade async job processing |
| `REDIS_HOST` / `REDIS_PORT` | Redis server connection (defaults work with Docker Compose) |
| `WHITEBOARD_REGION` | Netless whiteboard region (defaults to `sg` for MENA latency optimization) |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v3 secret key used on backend registration verification |
| `OPENAI_API_KEY` / `OPENAI_MODEL` / `OPENAI_ORGANIZATION` | OpenAI credentials and model selection (`gpt-4o-mini`) for AI Support Assistant and session summaries |
| `SENTRY_LARAVEL_DSN` | Backend error/performance monitoring (optional) |
| `ADMIN_ALERT_EMAIL` | Recipient for alerts when classroom provisioning fails after all retries (optional, but recommended) |

### 3. Configure Frontend Environment

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL — **must include the `/api/v1` prefix**, e.g. `http://localhost:8000/api/v1` |
| `INTERNAL_API_URL` | Internal backend API URL for Docker container SSR / Server Components, e.g. `http://laravel.test/api/v1` |
| `NEXT_PUBLIC_AGORA_APP_ID` | Agora App ID for video/audio classrooms |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key used on auth forms |
| `NEXT_PUBLIC_WHITEBOARD_APP_IDENTIFIER` | Netless App Identifier for the interactive whiteboard |
| `NEXT_PUBLIC_WHITEBOARD_REGION` | Netless region (defaults to `sg`, closest to MENA users) |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend error monitoring DSN (optional) |
| `SENTRY_AUTH_TOKEN` | Allows Sentry to upload Source Maps on Vercel production builds (optional) |
| `SENTRY_PROJECT` / `SENTRY_ORG` | Sentry project slug and organization slug — required for Source Map uploads |

### 4. Launch the Docker Environment

```bash
docker compose up -d --build
```

> **What this spins up:**
>
> - 🗄️ **MySQL 8.0** — port `3307` on the host, mapped to `3306` inside the container (to avoid conflicts with any local MySQL install)
> - 🔴 **Redis** — port `6390` on the host, mapped to `6379` inside the container
> - 🐘 **Laravel API Server** — port `8000`
> - ⚙️ **Laravel Queue Worker (`queue`)** — runs `php artisan queue:work redis` automatically in the background for classroom provisioning and event notifications
> - ⚛️ **Next.js Client** — port `3000`. The `nextjs` container automatically runs `npm install --legacy-peer-deps && npm run dev` on every startup — **no manual `npm install` step is needed inside Docker.** The first `docker compose up` will take noticeably longer while dependencies install; subsequent restarts are fast.

### 5. Backend Setup & Seeding

The Laravel container does **not** auto-run Composer or migrations — this step is manual:

```bash
# Enter the Laravel container
docker compose exec laravel.test bash

# Install PHP dependencies and generate the app key
composer install
php artisan key:generate

# Run migrations and seed initial data (verified teacher accounts, subjects, etc.)
php artisan migrate --seed
```

> 💡 **Automated Queue Worker:** Classroom provisioning (whiteboard room creation and Agora/Netless token pre-generation) runs asynchronously through Laravel's queue system. Under Docker Compose, the dedicated `queue` worker container runs this automatically. If running the backend locally outside Docker, start a worker with:
> ```bash
> php artisan queue:work redis --sleep=3 --tries=5 --max-time=3600
> ```

### 6. (Alternative) Running the Frontend Outside Docker

If you prefer to run the frontend directly on your machine instead of inside the `nextjs` container:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Local Development Endpoints

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
- **Filament Admin Panel:** [http://localhost:8000/admin](http://localhost:8000/admin)

---

## 🧪 Testing

### Backend — PHPUnit

The backend test suite uses **PHPUnit** via `php artisan test` with an in-memory **SQLite** database (configured in `phpunit.xml`) so no running MySQL server is required.

```bash
# Inside the Docker container:
docker compose exec laravel.test php artisan test

# Or directly if PHP is installed locally:
cd backend
php artisan test
```

**Current results:** `124 tests · 400 assertions` — all passing ✅

The suite covers:

| Test File | Area |
|---|---|
| `tests/Feature/Auth/` | Registration, login, Sanctum token issuance |
| `tests/Feature/AdminProfileTest.php` | Dynamic admin avatar resolution, storage URL generation & fallback |
| `tests/Feature/BookingLifecycleTest.php` | Full booking → session → completion → payout flow |
| `tests/Feature/BookingServiceTest.php` | Race-condition-safe slot reservation |
| `tests/Feature/ClassroomAccessTest.php` | Token generation, classroom join, Agora token refresh |
| `tests/Feature/DiscoveryTest.php` | Teacher search, subject & grade-level filtering |
| `tests/Feature/GenerateSessionSummaryJobTest.php` | Async AI session summary & quiz generation background job |
| `tests/Feature/ParentChildTest.php` | Parent sub-account management & spending permissions |
| `tests/Feature/PayoutRequestTest.php` | Teacher payout request lifecycle |
| `tests/Feature/ProfileTest.php` | Teacher KYC profile update & verification reset |
| `tests/Feature/ReviewTest.php` | Mandatory post-session review submission |
| `tests/Feature/SessionSummaryApiTest.php` | Session summary viewing, quiz submission & role permission checks |
| `tests/Feature/SupportChatApiTest.php` | AI Support Chat API validation, guest/authenticated context & rate limits |
| `tests/Feature/SupportTicketTest.php` | Support ticket creation & messaging |
| `tests/Feature/TeacherSlotTest.php` | Availability slot creation, update, deletion |
| `tests/Feature/WalletServiceTest.php` | Wallet deposit, deduction, overdraft protection |
| `tests/Unit/AgoraServiceTest.php` | Unit: Agora RTC, RTM & Screen token minting and atomic Redis caching |
| `tests/Unit/BookingServiceUnitTest.php` | Unit: booking business rules |
| `tests/Unit/PayoutServiceUnitTest.php` | Unit: payout calculation & commission split |
| `tests/Unit/ReviewServiceUnitTest.php` | Unit: review validation logic |
| `tests/Unit/SessionSummaryModelTest.php` | Unit: session summary Eloquent model relationships & cascading deletes |
| `tests/Unit/SupportKnowledgeBaseTest.php` | Unit: AI support prompt grounding, WhatsApp URI formatting & fake AI replies |
| `tests/Unit/WalletServiceUnitTest.php` | Unit: wallet transaction ledger |
| `tests/Unit/WhiteboardServiceTest.php` | Unit: Netless room creation & token minting |

### Frontend — Jest + React Testing Library

The frontend test suite uses **Jest** with `jest-environment-jsdom` and **React Testing Library**.

```bash
cd frontend
npm run test

# Run in watch mode during development:
npm run test:watch
```

**Current results:** `40 tests · 7 test suites` — all passing ✅

The suite covers:

| Test File | Area |
|---|---|
| `src/components/support/__tests__/TajSupportChatWidget.test.tsx` | AI Support Chat widget rendering, interactive chat & dual escalation cards |
| `src/components/classroom/__tests__/Whiteboard.test.tsx` | Whiteboard SDK integration & connection lifecycle |
| `src/components/dashboard/__tests__/utils.test.tsx` | Dashboard utility functions |
| `src/components/dashboard/financial/__tests__/WalletSummary.test.tsx` | Wallet summary component rendering |
| `src/app/classroom/__tests__/ClassroomPage.test.tsx` | Classroom page access control & rendering |
| `src/lib/__tests__/formatters.test.ts` | Date, currency, and number formatting helpers |

---

## 👤 Author

<div align="center">
  <p>Developed with ❤️ by <b>Eng. Ammar Al-Najjar (م. عمار النجار)</b></p>
  <p>
    <a href="https://github.com/Ammar-1993"><img src="https://img.shields.io/badge/GitHub-Ammar--1993-181717?style=flat-square&logo=github" alt="GitHub Profile" /></a>
    <a href="mailto:ammaralnggar@gmail.com"><img src="https://img.shields.io/badge/Email-ammaralnggar@gmail.com-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email" /></a>
  </p>
</div>