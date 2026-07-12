import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type { Member } from '@/types'

interface MemberManagerProps {
  clubId: number
  members: Member[]
  onRefresh: () => Promise<void>
}

type ConfirmAction = 'resetPin' | 'suspend' | 'revokeCard'

const inputClass =
  'glass-panel w-full rounded-xl border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary/30'

export function MemberManager({ clubId, members, onRefresh }: MemberManagerProps) {
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [nfcUid, setNfcUid] = useState('')
  const [creating, setCreating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmMember, setConfirmMember] = useState<Member | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const openConfirm = (action: ConfirmAction, member: Member) => {
    setConfirmAction(action)
    setConfirmMember(member)
  }

  const closeConfirm = () => {
    setConfirmAction(null)
    setConfirmMember(null)
  }

  const closeAddModal = () => {
    setAddOpen(false)
    setEmail('')
    setNfcUid('')
  }

  const memberLabel = (member: Member) => member.email ?? `User #${member.user_id}`

  const createMember = async () => {
    const trimmedEmail = email.trim()
    const trimmedNfc = nfcUid.trim()

    if (!trimmedEmail || !trimmedNfc) {
      toast({ title: 'Email and NFC UID are required', variant: 'error' })
      return
    }

    setCreating(true)
    try {
      await api.createMember(clubId, { email: trimmedEmail, nfc_uid: trimmedNfc })
      toast({ title: 'Member created', variant: 'success' })
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-white/50">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => setAddOpen(true)}>Add member</Button>
      </div>

      {members.length === 0 ? (
        <GlassPanel className="text-center text-white/50">
          No members found. Add one to get started.
        </GlassPanel>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <GlassPanel key={member.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{memberLabel(member)}</p>
                <p className="text-sm text-white/50">NFC: {member.nfc_uid ?? 'Revoked'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs',
                    member.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400',
                  )}
                >
                  {member.status}
                </span>
                {member.wallet_balance !== undefined && (
                  <span className="text-sm text-primary">{formatCurrency(member.wallet_balance)}</span>
                )}
                {member.requires_pin_setup && (
                  <span className="text-xs text-amber-400">PIN setup pending</span>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => openConfirm('resetPin', member)} size="sm" variant="outline">
                    Reset PIN
                  </Button>
                  {member.status === 'active' && (
                    <Button
                      onClick={() => openConfirm('suspend', member)}
                      size="sm"
                      variant="destructive"
                    >
                      Suspend
                    </Button>
                  )}
                  {member.nfc_uid && (
                    <Button
                      onClick={() => openConfirm('revokeCard', member)}
                      size="sm"
                      variant="destructive"
                    >
                      Revoke Card
                    </Button>
                  )}
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <Modal
        description="Create a user account and link an NFC card to this club."
        onOpenChange={(open) => {
          if (!open) closeAddModal()
        }}
        open={addOpen}
        title="Add member"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/60" htmlFor="member-email">
              Email
            </label>
            <input
              autoComplete="off"
              className={inputClass}
              id="member-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/60" htmlFor="member-nfc">
              NFC UID
            </label>
            <input
              autoComplete="off"
              className={inputClass}
              id="member-nfc"
              onChange={(e) => setNfcUid(e.target.value)}
              placeholder="04:A1:B2:C3:D4"
              type="text"
              value={nfcUid}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={closeAddModal} variant="ghost">
              Cancel
            </Button>
            <Button className="flex-1" disabled={creating} onClick={() => void createMember()}>
              {creating ? 'Creating…' : 'Create member'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
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
      </Modal>
    </div>
  )
}
