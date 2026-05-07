# Taj Frontend (Next.js 14) - Instructions & Conventions

This file provides specialized guidance for the Next.js frontend of the Taj Educational Platform.

## 🏛 Architectural Patterns

### 1. App Router & React Server Components (RSC)
- **Mandate:** Leverage React Server Components for data fetching whenever possible to minimize client-side JavaScript.
- **Organization:** 
    - Keep `page.tsx` files lean; delegate UI to components in `@/components`.
    - Use `layout.tsx` for persistent UI elements (Sidebar, Navbar).
    - Use `loading.tsx` for streaming and better UX during data fetching.

### 2. State Management
- **Server State:** Use **TanStack Query (React Query)** for all API interactions (fetching, caching, mutations). 
    - Define hooks in `@/hooks` (e.g., `useTeachers.ts`, `useBookings.ts`).
- **Form State:** Use **React Hook Form** for all forms to ensure performance and easy validation.
- **Global UI State:** Prefer React Context for simple global UI states (e.g., Auth, Notifications).

### 3. API Connectivity
- **Service Layer:** Define API call logic in `@/services` using Axios.
- **Authentication:** Manage Sanctum tokens via `js-cookie`. Handle session persistence in `@/context/AuthContext.tsx`.

---

## 🎨 UI & Styling

### 1. Tailwind CSS & Design System
- **Mandate:** Use utility classes for all styling. Avoid custom CSS files unless absolutely necessary.
- **Consistency:** Use `tailwind-merge` and `clsx` to handle dynamic class names safely.
- **Icons:** Use **Lucide React** for all iconography.

### 2. RTL & Localization
- **Mandate:** The platform is natively **Arabic (RTL)**. 
- **Layouts:** Use `dir="rtl"` in the root `layout.tsx`. 
- **Tailwind:** Use logical properties where possible (e.g., `ps-*` instead of `pl-*`) to support potential multi-directional layouts in the future, though the primary focus remains RTL.

---

## 🛠 Coding Standards

- **TypeScript:** 
    - Strict mode is mandatory. Avoid `any`.
    - Define shared types in `@/types`.
- **Naming:**
    - Components/Folders: `PascalCase`.
    - Hooks/Variables/Functions: `camelCase`.
    - Constants: `UPPER_SNAKE_CASE`.

---

## 🧪 Testing Protocol

- **Framework:** Jest & React Testing Library.
- **Coverage:**
    - **Unit Tests:** For utility functions and hooks.
    - **Integration Tests:** For complex component interactions (e.g., Booking form).
- **Command:** `npm run test`
- **Rule:** Every new component or feature should have an accompanying `.test.tsx` file.

---

## 🛰 Real-time Integration (Agora)
- **SDK:** Use `agora-react-uikit` for rapid video room implementation.
- **Configuration:** Ensure Agora credentials are never hardcoded; use environment variables.
- **Roles:** Correcty handle `host` (Teacher) vs. `audience` (Student) roles in the classroom components.
