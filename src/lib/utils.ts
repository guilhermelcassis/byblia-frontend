import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single className string
 * Uses clsx for conditional classes and tailwind-merge to handle
 * Tailwind CSS class conflicts properly
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
} 