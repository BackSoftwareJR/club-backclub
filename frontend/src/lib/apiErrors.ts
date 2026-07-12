interface ApiErrorPayload {
  message?: string
  error?: string
}

export class ApiRequestError extends Error {
  readonly status?: number
  readonly code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

export function resolveApiErrorMessage(
  status: number | undefined,
  payload: ApiErrorPayload | undefined,
): string {
  const code = payload?.error
  const fallback = payload?.message

  if (code === 'insufficient_funds') {
    return 'Insufficient wallet balance. Top up your wallet to continue.'
  }

  if (code === 'invalid_quantity') {
    return 'Invalid quantity. Adjust the amount to match the product step.'
  }

  if (code === 'pin_locked') {
    return 'Too many failed PIN attempts. Try again in 15 minutes.'
  }

  if (code === 'ip_blocked') {
    return 'Too many failed attempts from this device. Try again in 5 minutes.'
  }

  if (status === 402) {
    return fallback ?? 'Insufficient wallet balance. Top up your wallet to continue.'
  }

  if (status === 422) {
    return fallback ?? 'The request could not be processed. Check your input and try again.'
  }

  if (status === 403) {
    return fallback ?? 'Access denied. Contact your club administrator.'
  }

  if (status === 401) {
    return fallback ?? 'Invalid credentials.'
  }

  if (status === 429) {
    return fallback ?? 'Too many attempts. Please wait and try again.'
  }

  return fallback ?? 'An unexpected error occurred.'
}
