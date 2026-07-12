let audioContextRef: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null

  if (!audioContextRef) {
    audioContextRef = new AudioCtor()
  }

  return audioContextRef
}

export function playPurchaseConfirmSound(enabled: boolean): void {
  if (!enabled) return
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const audioContext = getAudioContext()
  if (!audioContext) return

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  const now = audioContext.currentTime
  const masterGain = audioContext.createGain()
  masterGain.gain.setValueAtTime(0.0001, now)
  masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.04)
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65)
  masterGain.connect(audioContext.destination)

  ;[659.25, 783.99, 987.77].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, now)
    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.5 / (index + 1), now + 0.02 + index * 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45 + index * 0.04)
    oscillator.connect(gain)
    gain.connect(masterGain)
    oscillator.start(now + index * 0.03)
    oscillator.stop(now + 0.6 + index * 0.04)
  })
}

export function triggerPurchaseHaptic(enabled: boolean): void {
  if (!enabled) return
  if (typeof navigator === 'undefined') return
  if (!('vibrate' in navigator)) return

  navigator.vibrate([25, 30, 40])
}
