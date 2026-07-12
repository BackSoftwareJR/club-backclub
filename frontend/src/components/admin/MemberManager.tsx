import { useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AdaptiveModal } from '@/components/ui/AdaptiveModal'
import { GlassFieldLabel, GlassInput } from '@/components/ui/GlassField'
import { InjectFundsSheet } from '@/components/admin/InjectFundsSheet'
import { api } from '@/lib/api'
import { buildNfcEntryUrl, copyTextToClipboard, generateNfcUid } from '@/lib/nfc'
import { gameEmailHint, isGamePlayEmail } from '@/lib/gameEmail'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type { Member } from '@/types'

interface MemberManagerProps {
  clubId: number
  members: Member[]
  onRefresh: () => Promise<void>
}

type ConfirmAction = 'resetPin' | 'suspend' | 'revokeCard'

export function MemberManager({ clubId, members, onRefresh }: MemberManagerProps) {
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [nfcUid, setNfcUid] = useState('')
  const [creating, setCreating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmMember, setConfirmMember] = useState<Member | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [injectMember, setInjectMember] = useState<Member | null>(null)
  const [actionsMember, setActionsMember] = useState<Member | null>(null)

  const closeAddModal = () => {
    setAddOpen(false)
    setEmail('')
    setNfcUid('')
  }

  const openAddModal = () => {
    setEmail('')
    setNfcUid(generateNfcUid())
    setAddOpen(true)
  }

  const memberLabel = (member: Member) => member.email ?? `User #${member.user_id}`
  const entryUrl = nfcUid.trim() ? buildNfcEntryUrl(clubId, nfcUid.trim()) : ''

  const copyEntryLink = async (url: string, title = 'Link copied') => {
    try {
      await copyTextToClipboard(url)
      toast({ title, description: 'NFC entry URL copied.', variant: 'success' })
    } catch {
      toast({ title: 'Copy failed', variant: 'error' })
    }
  }

  const openConfirm = (action: ConfirmAction, member: Member) => {
    setActionsMember(null)
    setConfirmAction(action)
    setConfirmMember(member)
  }

  const closeConfirm = () => {
    setConfirmAction(null)
    setConfirmMember(null)
  }

  const createMember = async () => {
    const trimmedEmail = email.trim()
    const trimmedNfc = nfcUid.trim()

    if (!trimmedEmail || !trimmedNfc) {
      toast({ title: 'Email and NFC UID are required', variant: 'error' })
      return
    }

    if (!isGamePlayEmail(trimmedEmail)) {
      toast({ title: 'Use a fictional game email', description: gameEmailHint, variant: 'error' })
      return
    }

    setCreating(true)
    try {
      await api.createMember(clubId, { email: trimmedEmail, nfc_uid: trimmedNfc })
      const link = buildNfcEntryUrl(clubId, trimmedNfc)
      try {
        await copyTextToClipboard(link)
        toast({
          title: 'Member created',
          description: 'NFC entry link copied to clipboard.',
          variant: 'success',
        })
      } catch {
        toast({ title: 'Member created', variant: 'success' })
      }
      closeAddModal()
      await onRefresh()
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

  const executeConfirm = async () => {
    if (!confirmAction || !confirmMember) return

    setActionLoading(true)
    try {
      switch (confirmAction) {
        case 'resetPin':
          await api.resetPin(clubId, confirmMember.id)
          toast({ title: 'PIN reset', description: 'Member must set up a new PIN.', variant: 'success' })
          break
        case 'suspend':
          await api.suspendMember(clubId, confirmMember.id)
          toast({ title: 'Member suspended', variant: 'success' })
          break
        case 'revokeCard':
          await api.revokeCard(clubId, confirmMember.id)
          toast({ title: 'Card revoked', variant: 'success' })
          break
      }
      closeConfirm()
      await onRefresh()
    } catch (err) {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const confirmCopy = (): { title: string; description: string; confirmLabel: string } => {
    const label = confirmMember ? memberLabel(confirmMember) : 'this member'
    switch (confirmAction) {
      case 'resetPin':
        return {
          title: 'Reset PIN',
          description: `Clear the PIN for ${label}? They will need to set up a new PIN on next entry.`,
          confirmLabel: 'Reset PIN',
        }
      case 'suspend':
        return {
          title: 'Suspend Member',
          description: `Suspend ${label}? They will be blocked from club access until reactivated manually.`,
          confirmLabel: 'Suspend',
        }
      case 'revokeCard':
        return {
          title: 'Revoke Card',
          description: `Revoke the NFC card for ${label}? They will no longer be able to enter with their current card.`,
          confirmLabel: 'Revoke Card',
        }
      default:
        return { title: '', description: '', confirmLabel: 'Confirm' }
    }
  }

  const { title, description, confirmLabel } = confirmCopy()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/50">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
        <Button className="gap-2" onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </div>

      {members.length === 0 ? (
        <GlassPanel className="text-center text-white/50">No members found. Add one to get started.</GlassPanel>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <GlassPanel key={member.id} className="space-y-4 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-medium">{memberLabel(member)}</p>
                  <p className="mt-1 truncate text-sm text-white/45">
                    NFC {member.nfc_uid ?? 'Revoked'}
                  </p>
                </div>
                <div className="text-right">
                  {member.wallet_balance !== undefined ? (
                    <p className="text-lg font-medium text-primary">{formatCurrency(member.wallet_balance)}</p>
                  ) : null}
                  <span
                    className={cn(
                      'mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wide',
                      member.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400',
                    )}
                  >
                    {member.status}
                  </span>
                </div>
              </div>

              {member.requires_pin_setup ? (
                <p className="text-xs text-amber-400">PIN setup pending on first entry</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {member.status === 'active' ? (
                  <Button onClick={() => setInjectMember(member)} size="sm">
                    Add funds
                  </Button>
                ) : null}
                {member.nfc_uid ? (
                  <Button
                    onClick={() =>
                      void copyEntryLink(buildNfcEntryUrl(clubId, member.nfc_uid!), 'Card link copied')
                    }
                    size="sm"
                    variant="outline"
                  >
                    Copy link
                  </Button>
                ) : null}
                <Button
                  onClick={() => setActionsMember(member)}
                  size="sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <AdaptiveModal
        description="Create a user account and link an NFC card to this club."
        onOpenChange={(open) => {
          if (!open) closeAddModal()
        }}
        open={addOpen}
        title="Add member"
      >
        <div className="space-y-4">
          <div>
            <GlassFieldLabel htmlFor="member-email">Game email (fictional)</GlassFieldLabel>
            <GlassInput
              autoComplete="off"
              id="member-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="player@velvet.club"
              type="email"
              value={email}
            />
            <p className="mt-1.5 text-xs text-white/40">{gameEmailHint}</p>
          </div>
          <div>
            <GlassFieldLabel
              action={
                <button
                  className="text-xs text-primary/90 transition hover:text-primary"
                  onClick={() => setNfcUid(generateNfcUid())}
                  type="button"
                >
                  Regenerate
                </button>
              }
              htmlFor="member-nfc"
            >
              NFC UID
            </GlassFieldLabel>
            <GlassInput
              className="font-mono text-sm tracking-wide"
              id="member-nfc"
              readOnly
              type="text"
              value={nfcUid}
            />
          </div>
          {entryUrl ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">NFC card URL</p>
              <p className="break-all font-mono text-xs text-white/70">{entryUrl}</p>
              <Button
                className="mt-3 w-full"
                onClick={() => void copyEntryLink(entryUrl)}
                type="button"
                variant="outline"
              >
                Copy link
              </Button>
            </div>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={closeAddModal} variant="ghost">
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={creating || !email.trim() || !nfcUid.trim() || !isGamePlayEmail(email.trim())}
              onClick={() => void createMember()}
            >
              {creating ? 'Creating…' : 'Create member'}
            </Button>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        description={description}
        onOpenChange={(open) => {
          if (!open) closeConfirm()
        }}
        open={confirmAction !== null}
        title={title}
      >
        <div className="flex gap-3">
          <Button className="flex-1" onClick={closeConfirm} variant="ghost">
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={actionLoading}
            onClick={() => void executeConfirm()}
            variant="destructive"
          >
            {actionLoading ? 'Processing…' : confirmLabel}
          </Button>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        description={actionsMember ? memberLabel(actionsMember) : undefined}
        onOpenChange={(open) => {
          if (!open) setActionsMember(null)
        }}
        open={actionsMember !== null}
        title="Member actions"
      >
        {actionsMember ? (
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              onClick={() => openConfirm('resetPin', actionsMember)}
              variant="outline"
            >
              Reset PIN
            </Button>
            {actionsMember.status === 'active' ? (
              <Button
                className="w-full justify-start"
                onClick={() => openConfirm('suspend', actionsMember)}
                variant="destructive"
              >
                Suspend member
              </Button>
            ) : null}
            {actionsMember.nfc_uid ? (
              <Button
                className="w-full justify-start"
                onClick={() => openConfirm('revokeCard', actionsMember)}
                variant="destructive"
              >
                Revoke card
              </Button>
            ) : null}
          </div>
        ) : null}
      </AdaptiveModal>

      <InjectFundsSheet
        clubId={clubId}
        member={injectMember}
        onOpenChange={(open) => {
          if (!open) setInjectMember(null)
        }}
        onSuccess={onRefresh}
        open={injectMember !== null}
      />
    </div>
  )
}
