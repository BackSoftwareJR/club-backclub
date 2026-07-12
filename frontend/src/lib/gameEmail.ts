const BLOCKED_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.it',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'gmx.com',
  'libero.it',
  'virgilio.it',
  'tim.it',
  'alice.it',
  'tin.it',
])

const ALLOWED_TLDS = new Set(['club', 'game', 'local', 'test', 'example', 'play', 'sim', 'demo'])

export function isGamePlayEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false

  const domain = trimmed.split('@')[1]?.toLowerCase() ?? ''
  if (!domain || BLOCKED_DOMAINS.has(domain)) return false

  const tld = domain.split('.').pop() ?? ''
  return ALLOWED_TLDS.has(tld)
}

export const gameEmailHint =
  'Solo email fittizie di gioco (es. player@velvet.club). Gmail, Outlook e provider reali non sono ammessi.'
