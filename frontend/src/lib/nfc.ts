/** Generate a unique NFC UID for new club members (e.g. NFC-A1B2C3D4E5F6). */
export function generateNfcUid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()

  return `NFC-${hex}`
}

/** Build the full entry URL to program on an NFC tag or share with the member. */
export function buildNfcEntryUrl(clubId: number, nfcUid: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/entry/${clubId}/${encodeURIComponent(nfcUid)}`
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
