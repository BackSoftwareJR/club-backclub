import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AmountChipRow, GlassFieldLabel, GlassInput, GlassTextarea } from '@/components/ui/GlassField'
import { api } from '@/lib/api'
import { formatCurrency, parsePositiveAmount } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type { Member } from '@/types'

interface TreasuryActionsProps {
  clubId: number
  onSuccess: () => Promise<void>
}

export function TreasuryActions({ clubId, onSuccess }: TreasuryActionsProps) {
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)

  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseLoading, setExpenseLoading] = useState(false)

  const [injectionUserId, setInjectionUserId] = useState('')
  const [injectionAmount, setInjectionAmount] = useState('')
  const [injectionDescription, setInjectionDescription] = useState('')
  const [injectionLoading, setInjectionLoading] = useState(false)

  const loadMembers = async () => {
    const response = await api.listMembers(clubId)
    setMembers(response.data ?? [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        await loadMembers()
      } catch (err) {
        toast({
          title: 'Failed to load members',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'error',
        })
      } finally {
        setMembersLoading(false)
      }
    }
    void load()
  }, [clubId, toast])

  const submitExpense = async () => {
    const amount = parsePositiveAmount(expenseAmount)
    if (!amount) {
      toast({ title: 'Enter a valid positive amount (e.g. 120.00)', variant: 'error' })
      return
    }
    if (!expenseDescription.trim()) {
      toast({ title: 'Description is required', variant: 'error' })
      return
    }

    setExpenseLoading(true)
    try {
      await api.recordExpense(clubId, {
        amount,
        description: expenseDescription.trim(),
      })
      toast({ title: 'Expense recorded', variant: 'success' })
      setExpenseAmount('')
      setExpenseDescription('')
      await onSuccess()
    } catch (err) {
      toast({
        title: 'Failed to record expense',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setExpenseLoading(false)
    }
  }

  const submitInjection = async () => {
    const amount = parsePositiveAmount(injectionAmount)
    if (!amount) {
      toast({ title: 'Enter a valid positive amount (e.g. 30.00)', variant: 'error' })
      return
    }
    if (!injectionUserId) {
      toast({ title: 'Select a member', variant: 'error' })
      return
    }

    setInjectionLoading(true)
    try {
      const result = await api.adminInjection(clubId, {
        user_id: Number(injectionUserId),
        amount,
        description: injectionDescription.trim() || undefined,
      })
      toast({
        title: 'Funds added',
        description: `New balance: ${formatCurrency(result.new_balance)}`,
        variant: 'success',
      })
      setInjectionAmount('')
      setInjectionDescription('')
      await Promise.all([onSuccess(), loadMembers()])
    } catch (err) {
      toast({
        title: 'Injection failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setInjectionLoading(false)
    }
  }

  const activeMembers = members.filter((member) => member.status === 'active')
  const expenseAmountValid = parsePositiveAmount(expenseAmount) !== null
  const injectionAmountValid = parsePositiveAmount(injectionAmount) !== null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassPanel className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Direct injection</h3>
          <p className="mt-1 text-sm text-white/50">
            Credit a member wallet instantly. You can also add funds from each member card.
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            {membersLoading ? (
              <p className="text-sm text-white/45">Loading members…</p>
            ) : (
              activeMembers.map((member) => (
                <button
                  key={member.user_id}
                  className={`glass-list-item flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                    injectionUserId === String(member.user_id)
                      ? 'border-primary/35 bg-primary/10 text-primary'
                      : 'text-white/80'
                  }`}
                  onClick={() => setInjectionUserId(String(member.user_id))}
                  type="button"
                >
                  <span>{member.email ?? `User #${member.user_id}`}</span>
                  <span className="text-white/45">
                    {member.wallet_balance !== undefined
                      ? formatCurrency(member.wallet_balance)
                      : '—'}
                  </span>
                </button>
              ))
            )}
          </div>
          <AmountChipRow amounts={[10, 25, 50, 100]} onPick={setInjectionAmount} />
          <div>
            <GlassFieldLabel htmlFor="injection-amount">Amount</GlassFieldLabel>
            <GlassInput
              id="injection-amount"
              inputMode="decimal"
              onChange={(event) => setInjectionAmount(event.target.value)}
              placeholder="30.00"
              type="text"
              value={injectionAmount}
            />
          </div>
          <div>
            <GlassFieldLabel hint="Optional" htmlFor="injection-description">
              Note
            </GlassFieldLabel>
            <GlassInput
              id="injection-description"
              onChange={(event) => setInjectionDescription(event.target.value)}
              placeholder="Manual correction"
              type="text"
              value={injectionDescription}
            />
          </div>
          <Button
            className="w-full"
            disabled={injectionLoading || !injectionUserId || !injectionAmountValid}
            onClick={() => void submitInjection()}
          >
            {injectionLoading ? 'Adding…' : 'Add funds'}
          </Button>
        </div>
      </GlassPanel>

      <GlassPanel className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Log expense</h3>
          <p className="mt-1 text-sm text-white/50">
            Record a club expense as a negative ledger entry.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <GlassFieldLabel htmlFor="expense-amount">Amount</GlassFieldLabel>
            <GlassInput
              id="expense-amount"
              inputMode="decimal"
              onChange={(event) => setExpenseAmount(event.target.value)}
              placeholder="120.00"
              type="text"
              value={expenseAmount}
            />
          </div>
          <div>
            <GlassFieldLabel htmlFor="expense-description">Description</GlassFieldLabel>
            <GlassTextarea
              id="expense-description"
              onChange={(event) => setExpenseDescription(event.target.value)}
              placeholder="Wholesale stock, supplies, event costs…"
              value={expenseDescription}
            />
          </div>
          <Button
            className="w-full"
            disabled={expenseLoading || !expenseAmountValid || !expenseDescription.trim()}
            onClick={() => void submitExpense()}
            variant="outline"
          >
            {expenseLoading ? 'Recording…' : 'Record expense'}
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
