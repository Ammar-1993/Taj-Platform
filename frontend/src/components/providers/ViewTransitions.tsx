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
      // If the browser supports View Transitions API and the document is currently visible
      if (
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        !document.hidden
      ) {
        try {
          const doc = document as unknown as {
            startViewTransition: (cb: () => void) => {
              finished?: Promise<void>;
              ready?: Promise<void>;
            };
          };

          const transition = doc.startViewTransition(() => {
            // This is a dummy update because React has already updated the DOM
            // based on the pathname change.
          });

          // Handlers to catch aborts when tab is switched/minimized (InvalidStateError)
          transition?.finished?.catch(() => {
            // Gracefully ignore aborted view transitions
          });
          transition?.ready?.catch(() => {
            // Gracefully ignore aborted view transitions
          });
        } catch {
          // Gracefully fallback if the browser throws synchronously when state is invalid
        }
      }
      lastPathname.current = pathname;
    }
  }, [pathname]);

  return <>{children}</>;
}
