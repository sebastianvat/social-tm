import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ro-RO').format(num)
}

export function formatTokens(tokens: number): string {
  return new Intl.NumberFormat('ro-RO').format(tokens)
}
