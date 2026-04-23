import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely, resolving conflicts via tailwind-merge
 * and handling conditional classes via clsx. Replaces the old manual filter/join.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
