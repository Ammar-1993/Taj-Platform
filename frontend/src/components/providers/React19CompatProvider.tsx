"use client";

/**
 * React 19 Compatibility Initializer
 *
 * This is a zero-render client boundary whose sole purpose is to trigger
 * the react19-legacy-compat side-effect import inside a proper Client
 * Component context (where react-dom/client is allowed).
 *
 * layout.tsx is a Server Component and cannot import react-dom/client
 * directly. By placing that import here (behind "use client"), Next.js
 * correctly bundles it only for the browser.
 */
import "@/lib/react19-legacy-compat";

export default function React19CompatProvider() {
  return null; // Pure side-effect — renders nothing
}
