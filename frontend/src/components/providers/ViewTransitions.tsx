"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * ViewTransitions Component
 * 
 * Provides support for the browser's View Transitions API in Next.js App Router.
 * This allows for smooth cross-fade or custom animations during page navigation.
 */
export function ViewTransitions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  // We use useLayoutEffect to capture the state before the browser repaints
  useLayoutEffect(() => {
    if (lastPathname.current !== pathname) {
      // If the browser supports View Transitions API
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
            // This is a dummy update because React has already updated the DOM
            // based on the pathname change. 
            // In a real SPA, this would wrap the state change.
            // In Next.js App Router, the layout stays and the page changes.
        });
      }
      lastPathname.current = pathname;
    }
  }, [pathname]);

  return <>{children}</>;
}
