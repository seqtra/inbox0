/**
 * Utility Functions for Frontend
 *
 * The cn() function is used throughout shadcn/ui components
 * to merge Tailwind CSS classes conditionally.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names intelligently using clsx and tailwind-merge
 *
 * This function:
 * 1. Uses clsx to handle conditional classes
 * 2. Uses tailwind-merge to properly merge Tailwind classes without conflicts
 *
 * @param inputs - Class names to combine
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-3') // 'py-1 px-3' (px-3 overrides px-2)
 * cn('text-red-500', condition && 'text-blue-500') // Conditionally applies classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
