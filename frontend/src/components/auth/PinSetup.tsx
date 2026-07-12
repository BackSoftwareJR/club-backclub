import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { PinNumpad } from '@/components/auth/PinNumpad'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'

interface PinSetupProps {
  clubId: number
  nfcUid: string
  clubName: string
}

export function PinSetup({ clubId, nfcUid, clubName }: PinSetupProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  const handleComplete = async (entered: string) => {
    if (step === 'create') {
      setPin(entered)
      setStep('confirm')
      setConfirmPin('')
      return
    }

    if (submittingRef.current || loading) return

    if (entered !== pin) {
      toast({
        title: 'PINs do not match',
        description: 'Please try again.',
        variant: 'error',
      })
      setStep('create')
      setPin('')
      setConfirmPin('')
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      const response = await api.pinSetup({ club_id: clubId, nfc_uid: nfcUid, pin: entered })
      login(response, nfcUid)
      void navigate({ to: '/club/$clubId', params: { clubId: String(clubId) } })
    } catch (err) {
      toast({
        title: 'Setup failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
      setStep('create')
      setPin('')
      setConfirmPin('')
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      <AuthScreen key={step} screenKey={`pin-setup-${step}`}>
        <GlassPanel className="mx-auto max-w-md text-center">
          <p className="mb-1 text-sm uppercase tracking-[0.2em] text-primary/80">Welcome</p>
          <h1 className="mb-2 text-3xl">{clubName}</h1>
          <p className="mb-8 text-white/60">
            {step === 'create' ? 'Create your 6-digit PIN' : 'Confirm your PIN'}
          </p>
          <PinNumpad
            disabled={loading}
            onChange={step === 'create' ? setPin : setConfirmPin}
            onComplete={(p) => void handleComplete(p)}
            value={step === 'create' ? pin : confirmPin}
          />
        </GlassPanel>
      </AuthScreen>
    </AnimatePresence>
  )
}
