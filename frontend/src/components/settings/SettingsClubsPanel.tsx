import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, Copy, ExternalLink, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { GlassInput } from '@/components/ui/GlassField'
import { ClubCreateTermsModal } from '@/components/legal/ClubCreateTermsModal'
import { ActivityLogPanel } from '@/components/legal/ActivityLogPanel'
import { api } from '@/lib/api'
import { buildNfcEntryUrl, copyTextToClipboard } from '@/lib/nfc'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'
import { cn } from '@/lib/utils'
import type { CreateClubResponse, UserClubSummary } from '@/types'

export function SettingsClubsPanel() {
  const { session, isClubOwner, clubId } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [clubs, setClubs] = useState<UserClubSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clubName, setClubName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdClub, setCreatedClub] = useState<CreateClubResponse | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [pendingClubName, setPendingClubName] = useState('')
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)

  const loadClubs = useCallback(async () => {
    setError(null)
    const response = await api.listMyClubs()
    setClubs(response.clubs)
    setSelectedClubId((current) => {
      if (current !== null && response.clubs.some((club) => club.id === current)) {
        return current
      }
      const currentClub = response.clubs.find((club) => club.is_current)
      return currentClub?.id ?? response.clubs[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        await loadClubs()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clubs')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [loadClubs])

  const copyLink = async (targetClubId: number, nfcUid: string, title = 'Link copiato') => {
    try {
      await copyTextToClipboard(buildNfcEntryUrl(targetClubId, nfcUid))
      toast({ title, description: 'Link NFC copiato negli appunti.', variant: 'success' })
    } catch {
      toast({ title: 'Copia non riuscita', variant: 'error' })
    }
  }

  const openEntry = (targetClubId: number, nfcUid: string) => {
    window.location.assign(buildNfcEntryUrl(targetClubId, nfcUid))
  }

  const manageClub = (club: UserClubSummary) => {
    if (!club.nfc_uid) {
      toast({ title: 'Carta NFC revocata', variant: 'error' })
      return
    }

    if (club.is_current) {
      if (club.is_owner) {
        void navigate({ to: '/club/$clubId/admin', params: { clubId: String(club.id) } })
        return
      }
      void navigate({ to: '/club/$clubId', params: { clubId: String(club.id) } })
      return
    }

    openEntry(club.id, club.nfc_uid)
  }

  const createClub = () => {
    const trimmed = clubName.trim()
    if (trimmed.length < 2) {
      toast({ title: 'Inserisci un nome club (minimo 2 caratteri)', variant: 'error' })
      return
    }

    setPendingClubName(trimmed)
    setTermsOpen(true)
  }

  const finalizeCreateClub = async (termsVersion: string) => {
    if (!pendingClubName) return

    setCreating(true)
    setTermsOpen(false)
    try {
      const response = await api.createClub({
        name: pendingClubName,
        terms_version: termsVersion,
        terms_accepted: true,
        identity_declaration: true,
      })
      setCreatedClub(response)
      setClubName('')
      setPendingClubName('')
      await loadClubs()
      await copyLink(response.club.id, response.nfc_uid, 'Club creato — link copiato')
    } catch (err) {
      toast({
        title: 'Creazione non riuscita',
        description: err instanceof Error ? err.message : 'Errore sconosciuto',
        variant: 'error',
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LuxurySpinner label="Loading settings" />
      </div>
    )
  }

  if (error) {
    return (
      <GlassPanel className="space-y-4 text-center">
        <p className="text-red-400">{error}</p>
        <Button onClick={() => void loadClubs().catch(() => undefined)}>Riprova</Button>
      </GlassPanel>
    )
  }

  const selectedClub = clubs.find((club) => club.id === selectedClubId) ?? null

  return (
    <div className="space-y-8">
      <GlassPanel className="space-y-4">
        <div>
          <h3 className="text-lg">Account</h3>
          <p className="text-sm text-white/50">{session?.user.email}</p>
        </div>
        <p className="text-sm text-white/60">
          Ogni club ha la propria carta NFC e PIN. Da qui puoi gestirli anche da telefono.
        </p>
      </GlassPanel>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg">Gestisci i miei club</h3>
          <p className="text-sm text-white/50">
            Seleziona un club e apri la dashboard admin o il catalogo.
          </p>
        </div>

        {clubs.length === 0 ? (
          <GlassPanel className="text-center text-white/50">Nessun club ancora.</GlassPanel>
        ) : (
          <div className="space-y-3">
            {clubs.map((club) => {
              const isSelected = selectedClubId === club.id

              return (
                <button
                  key={club.id}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition',
                    isSelected
                      ? 'border-primary/40 bg-primary/10 shadow-[0_0_24px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20',
                  )}
                  onClick={() => setSelectedClubId(club.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-medium">{club.name}</p>
                        {club.is_current ? (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                            Attivo
                          </span>
                        ) : null}
                        {club.is_owner ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
                            Owner
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-white/50">
                        NFC: {club.nfc_uid ?? 'Revocata'} · {club.member_status}
                      </p>
                      {club.requires_pin_setup ? (
                        <p className="mt-1 text-xs text-amber-400">PIN da impostare al primo accesso</p>
                      ) : null}
                    </div>
                    <ChevronRight
                      className={cn(
                        'mt-1 h-5 w-5 shrink-0 transition',
                        isSelected ? 'text-primary' : 'text-white/30',
                      )}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selectedClub ? (
          <GlassPanel className="space-y-4 border-primary/20 bg-primary/5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Club selezionato</p>
              <p className="mt-1 text-lg font-medium">{selectedClub.name}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="min-h-12 w-full justify-center gap-2"
                onClick={() => manageClub(selectedClub)}
                type="button"
              >
                <Shield className="h-4 w-4" />
                {selectedClub.is_current
                  ? selectedClub.is_owner
                    ? 'Gestisci admin'
                    : 'Apri catalogo'
                  : 'Accedi con NFC'}
              </Button>

              {selectedClub.nfc_uid ? (
                <>
                  <Button
                    className="min-h-12 w-full justify-center gap-2"
                    onClick={() => void copyLink(selectedClub.id, selectedClub.nfc_uid!)}
                    type="button"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4" />
                    Copia link NFC
                  </Button>
                  {!selectedClub.is_current ? (
                    <Button
                      className="min-h-12 w-full justify-center gap-2 sm:col-span-2"
                      onClick={() => openEntry(selectedClub.id, selectedClub.nfc_uid!)}
                      type="button"
                      variant="ghost"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Cambia club (entry NFC)
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </GlassPanel>
        ) : null}
      </div>

      <GlassPanel className="space-y-4">
        <div>
          <h3 className="text-lg">Crea un club</h3>
          <p className="text-sm text-white/50">
            Diventi owner. Viene generato un link NFC univoco.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <GlassInput
            onChange={(event) => setClubName(event.target.value)}
            placeholder="Il mio club privato"
            type="text"
            value={clubName}
          />
          <Button className="min-h-12 shrink-0" disabled={creating} onClick={() => void createClub()}>
            Crea club
          </Button>
        </div>
        {createdClub ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="mb-2 text-sm text-primary">
              <strong>{createdClub.club.name}</strong> è pronto.
            </p>
            <p className="mb-3 break-all font-mono text-xs text-white/70">
              {buildNfcEntryUrl(createdClub.club.id, createdClub.nfc_uid)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  void copyLink(createdClub.club.id, createdClub.nfc_uid, 'Link copiato')
                }
                size="sm"
                variant="outline"
              >
                Copia link
              </Button>
              <Button onClick={() => openEntry(createdClub.club.id, createdClub.nfc_uid)} size="sm">
                Apri club
              </Button>
            </div>
            {createdClub.requires_pin_setup ? (
              <p className="mt-3 text-xs text-amber-400">
                Primo accesso: ti verrà chiesto un PIN a 6 cifre.
              </p>
            ) : null}
          </div>
        ) : null}
      </GlassPanel>

      {isClubOwner && clubId ? <ActivityLogPanel clubId={clubId} /> : null}

      <ClubCreateTermsModal
        loading={creating}
        onConfirm={(version) => void finalizeCreateClub(version)}
        onOpenChange={setTermsOpen}
        open={termsOpen}
      />
    </div>
  )
}
