import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, deduping conflicting utilities.
 * Usage: cn("px-4", condition && "px-6") → "px-6"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
