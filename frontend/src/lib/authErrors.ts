interface ApiErrorPayload {
  message?: string
  error?: string
}

export function resolveAuthErrorMessage(
  status: number | undefined,
  payload: ApiErrorPayload | undefined,
): string {
  const code = payload?.error
  const fallback = payload?.message

  if (code === 'pin_locked') {
    return 'Too many failed PIN attempts. Try again in 15 minutes.'
  }

  if (code === 'ip_blocked') {
    return 'Too many failed attempts from this device. Try again in 5 minutes.'
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
