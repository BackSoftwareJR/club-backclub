import { useRef, useState } from 'react'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { PinNumpad } from '@/components/auth/PinNumpad'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'

interface PinEntryProps {
  clubId: number
  nfcUid: string
  clubName: string
  mode?: 'login' | 'unlock'
  onSuccess?: () => void
}

export function PinEntry({
  clubId,
  nfcUid,
  clubName,
  mode = 'login',
  onSuccess,
}: PinEntryProps) {
  const { login, unlock } = useAuth()
  const { toast } = useToast()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  const handleComplete = async (entered: string) => {
    if (submittingRef.current || loading) return

    submittingRef.current = true
    setLoading(true)

    try {
      if (mode === 'unlock') {
        await unlock(entered)
        onSuccess?.()
      } else {
        const response = await api.login({ club_id: clubId, nfc_uid: nfcUid, pin: entered })
        login(response, nfcUid)
        onSuccess?.()
      }
    } catch (err) {
      toast({
        title: mode === 'unlock' ? 'Unlock failed' : 'Login failed',
        description: err instanceof Error ? err.message : 'Invalid PIN',
        variant: 'error',
      })
      setPin('')
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <AuthScreen screenKey={`pin-entry-${mode}`}>
      <GlassPanel className="mx-auto max-w-md text-center">
        <p className="mb-1 text-sm uppercase tracking-[0.2em] text-primary/80">
          {mode === 'unlock' ? 'Session Locked' : 'Enter PIN'}
        </p>
        <h1 className="mb-2 text-3xl">{clubName}</h1>
        <p className="mb-8 text-white/60">
          {mode === 'unlock'
            ? 'Your session timed out. Re-enter your PIN.'
            : 'Enter your 6-digit PIN to continue'}
        </p>
        <PinNumpad
          disabled={loading}
          onChange={setPin}
          onComplete={(p) => void handleComplete(p)}
          value={pin}
        />
      </GlassPanel>
    </AuthScreen>
  )
}
