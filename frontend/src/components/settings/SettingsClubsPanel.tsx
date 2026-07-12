import { useCallback, useEffect, useState } from 'react'
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
import type { CreateClubResponse, UserClubSummary } from '@/types'

export function SettingsClubsPanel() {
  const { session, isClubOwner, clubId } = useAuth()
  const { toast } = useToast()
  const [clubs, setClubs] = useState<UserClubSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clubName, setClubName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdClub, setCreatedClub] = useState<CreateClubResponse | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [pendingClubName, setPendingClubName] = useState('')

  const loadClubs = useCallback(async () => {
    setError(null)
    const response = await api.listMyClubs()
    setClubs(response.clubs)
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

  const copyLink = async (clubId: number, nfcUid: string, title = 'Link copied') => {
    try {
      await copyTextToClipboard(buildNfcEntryUrl(clubId, nfcUid))
      toast({ title, description: 'NFC entry URL copied to clipboard.', variant: 'success' })
    } catch {
      toast({ title: 'Copy failed', variant: 'error' })
    }
  }

  const openClub = (clubId: number, nfcUid: string) => {
    window.location.assign(buildNfcEntryUrl(clubId, nfcUid))
  }

  const createClub = () => {
    const trimmed = clubName.trim()
    if (trimmed.length < 2) {
      toast({ title: 'Enter a club name (at least 2 characters)', variant: 'error' })
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
      await copyLink(response.club.id, response.nfc_uid, 'Club created — link copied')
    } catch (err) {
      toast({
        title: 'Create failed',
        description: err instanceof Error ? err.message : 'Unknown error',
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
        <Button onClick={() => void loadClubs().catch(() => undefined)}>Retry</Button>
      </GlassPanel>
    )
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="space-y-4">
        <div>
          <h3 className="text-lg">Account</h3>
          <p className="text-sm text-white/50">{session?.user.email}</p>
        </div>
        <p className="text-sm text-white/60">
          Each club uses its own NFC card and PIN. Switch clubs by opening the entry link for that club.
        </p>
      </GlassPanel>

      <GlassPanel className="space-y-4">
        <div>
          <h3 className="text-lg">Create a club</h3>
          <p className="text-sm text-white/50">
            You become the owner. A unique NFC entry link is generated automatically.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <GlassInput
            onChange={(event) => setClubName(event.target.value)}
            placeholder="My Private Club"
            type="text"
            value={clubName}
          />
          <Button className="shrink-0" disabled={creating} onClick={() => void createClub()}>
            Create club
          </Button>
        </div>
        {createdClub ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="mb-2 text-sm text-primary">
              <strong>{createdClub.club.name}</strong> is ready.
            </p>
            <p className="mb-3 font-mono text-xs text-white/70 break-all">
              {buildNfcEntryUrl(createdClub.club.id, createdClub.nfc_uid)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  void copyLink(createdClub.club.id, createdClub.nfc_uid, 'Link copied')
                }
                size="sm"
                variant="outline"
              >
                Copy link
              </Button>
              <Button
                onClick={() => openClub(createdClub.club.id, createdClub.nfc_uid)}
                size="sm"
              >
                Open club
              </Button>
            </div>
            {createdClub.requires_pin_setup ? (
              <p className="mt-3 text-xs text-amber-400">
                First visit: you will be asked to set a 6-digit PIN for this club.
              </p>
            ) : null}
          </div>
        ) : null}
      </GlassPanel>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg">My clubs</h3>
          <p className="text-sm text-white/50">{clubs.length} club{clubs.length !== 1 ? 's' : ''}</p>
        </div>

        {clubs.length === 0 ? (
          <GlassPanel className="text-center text-white/50">No clubs yet.</GlassPanel>
        ) : (
          <div className="grid gap-4">
            {clubs.map((club) => (
              <GlassPanel key={club.id} className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-medium">{club.name}</p>
                      {club.is_current ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                          Current
                        </span>
                      ) : null}
                      {club.is_owner ? (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                          Owner
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-white/50">
                      NFC: {club.nfc_uid ?? 'Revoked'} · {club.member_status}
                    </p>
                    {club.requires_pin_setup ? (
                      <p className="text-xs text-amber-400">PIN setup pending</p>
                    ) : null}
                  </div>
                </div>

                {club.nfc_uid ? (
                  <div className="flex flex-wrap gap-2">
                    {!club.is_current ? (
                      <Button onClick={() => openClub(club.id, club.nfc_uid!)} size="sm">
                        Switch to club
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => void copyLink(club.id, club.nfc_uid!)}
                      size="sm"
                      variant="outline"
                    >
                      Copy entry link
                    </Button>
                  </div>
                ) : null}
              </GlassPanel>
            ))}
          </div>
        )}
      </div>

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
