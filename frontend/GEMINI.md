# 👑 Taj Educational Platform (منصة تاج التعليمية) - AI System Context

## 📌 Project Overview

Taj is a comprehensive SaaS Educational Technology (EdTech) platform designed for the Arab world. It connects three primary user roles:

1. **Students (الطلاب):** Book sessions, attend virtual classes, manage their wallet.
2. **Teachers (المعلمون):** Set schedules, manage bookings, conduct virtual classes, withdraw earnings.
3. **Parents (أولياء الأمور):** Fund wallets, track multiple children's progress and bookings, view financial transactions.

---

## 🛠️ Tech Stack & Tools

- **Framework:** Next.js (App Router) / React
- **Language:** TypeScript (Strict typing enforced)
- **Styling:** Tailwind CSS (Custom Design System configured in `tailwind.config.ts`)
- **State Management & Data Fetching:** React Query (for optimistic updates and caching)
- **Forms & Validation:** React Hook Form + Zod (No native HTML5 browser validation)
- **Icons:** Lucide React

---

## 🎨 UI/UX & Design System Rules (CRITICAL FOR AI)

When generating code or UI components for this project, you MUST strictly adhere to the following rules:

### 1. RTL First (Right-to-Left Native)

- The platform is strictly Arabic (`dir="rtl"`).
- Always consider RTL flow: logical properties (`ms-`, `me-`, `ps-`, `pe-`) are preferred over physical ones (`ml-`, `mr-`).
- Icons trailing text should be on the left; leading icons on the right.
- **Bidi Text:** When mixing numbers and Arabic words (e.g., Currency), ALWAYS use the `<CurrencyDisplay />` component. It uses a strict LTR Flex container to prevent visual swapping (e.g., `<div className="flex items-center gap-1" dir="ltr"><span className="text-xs">ر.س</span><span className="font-medium">50.00</span></div>`).

### 2. Custom Tailwind Theme (Taj Design System)

- **Colors:** Use semantic brand colors defined in our config (`bg-brand-600`, `text-brand-700`, `bg-surface`, `border-border`). DO NOT use default Tailwind colors like `blue-500` or `indigo-600` for primary actions.
- **Border Radius:** Use our custom Taj scale (`rounded-taj-sm`, `rounded-taj-md`, `rounded-taj-lg`, `rounded-taj-xl`). DO NOT use generic `rounded-lg` for major components.
- **Micro-interactions:** Utilize custom animations from our config (e.g., `animate-fade-up`, `hover:-translate-y-1 transition-all duration-300`).

### 3. Data Formatting (Single Source of Truth)

NEVER format dates, times, or currencies manually in the components. ALWAYS import and use the utility functions from `@/lib/formatters.ts`:

- `formatDate(date, 'short' | 'medium' | 'long')`: For human-readable dates.
- `formatDatetime(rawDbString, 'medium')`: To parse raw DB strings like "00:00:00 2026-05-20".
- `formatTime(time)`: For 12h Arabic time format.
- `formatCurrency(amount, 'label')`: Automatically appends "ر.س" and forces 2 decimal places using Latin numerals.
- _Rule:_ The platform uses the locale `ar-SA-u-nu-latn` to force Arabic text but Latin numerals (1, 2, 3).
- **CRITICAL:** Use `<CurrencyDisplay amount={value} />` for all visual currency elements instead of raw `formatCurrency` in JSX.

### 4. Component Structure & Quality

- Focus on Clean Code, Modular Components, and avoiding "prop drilling".
- Handle Empty States elegantly (e.g., "لا توجد مواعيد" with disabled buttons).
- **Optimistic UI:** For instant user feedback (like marking notifications as read), update the local state immediately before waiting for the API response.

---

## 🏗️ Specific Domain Rules

- **Virtual Classroom:** Video elements MUST use `object-cover` (for camera) or `object-contain` (for screen share) to prevent visual distortion. Control bars must have a fixed height (`h-20` shrink-0) to prevent expanding over the video area.
- **Parent Logic:** Parents DO NOT earn money; they fund. Never route a parent to a "Withdraw Payouts" page. Direct them to a "Billing/Transactions" history.

---

**AI Instruction:** Read this document carefully. Assume all generated code must comply with these guidelines unless explicitly instructed otherwise by the user.
