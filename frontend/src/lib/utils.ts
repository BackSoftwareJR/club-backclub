import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const POSITIVE_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

export function parsePositiveAmount(value: string): string | null {
  const trimmed = value.trim()
  if (!POSITIVE_AMOUNT_PATTERN.test(trimmed)) return null

  const amount = parseFloat(trimmed)
  if (!Number.isFinite(amount) || amount <= 0) return null

  return amount.toFixed(2)
}
