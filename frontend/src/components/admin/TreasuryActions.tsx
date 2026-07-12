import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type { Member } from '@/types'

interface TreasuryActionsProps {
  clubId: number
  onSuccess: () => Promise<void>
}

const inputClass =
  'glass-panel w-full rounded-xl border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary/30'

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

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await api.listMembers(clubId)
        setMembers(response.data ?? [])
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
    void loadMembers()
  }, [clubId])

  const submitExpense = async () => {
    setExpenseLoading(true)
    try {
      await api.recordExpense(clubId, {
        amount: expenseAmount,
        description: expenseDescription,
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
    setInjectionLoading(true)
    try {
      const result = await api.adminInjection(clubId, {
        user_id: Number(injectionUserId),
        amount: injectionAmount,
        description: injectionDescription || undefined,
      })
      toast({
        title: 'Funds injected',
        description: `New balance: ${formatCurrency(result.new_balance)}`,
        variant: 'success',
      })
      setInjectionAmount('')
      setInjectionDescription('')
      await onSuccess()
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassPanel>
        <h3 className="mb-4 text-lg font-medium">Log Expense</h3>
        <p className="mb-4 text-sm text-white/50">
          Record a club expense. The amount is stored as a negative ledger entry.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-white/70" htmlFor="expense-amount">
              Amount
            </label>
            <input
              className={inputClass}
              id="expense-amount"
              inputMode="decimal"
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="120.00"
              type="text"
              value={expenseAmount}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70" htmlFor="expense-description">
              Description
            </label>
            <input
              className={inputClass}
              id="expense-description"
              onChange={(e) => setExpenseDescription(e.target.value)}
              placeholder="Wholesale stock"
              type="text"
              value={expenseDescription}
            />
          </div>
          <Button
            className="w-full"
            disabled={expenseLoading || !expenseAmount || !expenseDescription}
            onClick={() => void submitExpense()}
          >
            {expenseLoading ? 'Recording…' : 'Record Expense'}
          </Button>
        </div>
      </GlassPanel>

      <GlassPanel>
        <h3 className="mb-4 text-lg font-medium">Direct Injection</h3>
        <p className="mb-4 text-sm text-white/50">
          Credit a member wallet directly and add an admin injection ledger entry.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-white/70" htmlFor="injection-member">
              Member
            </label>
            <select
              className={inputClass}
              disabled={membersLoading}
              id="injection-member"
              onChange={(e) => setInjectionUserId(e.target.value)}
              value={injectionUserId}
            >
              <option value="">
                {membersLoading ? 'Loading members…' : 'Select a member'}
              </option>
              {activeMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.email ?? `User #${member.user_id}`}
                  {member.wallet_balance !== undefined
                    ? ` (${formatCurrency(member.wallet_balance)})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70" htmlFor="injection-amount">
              Amount
            </label>
            <input
              className={inputClass}
              id="injection-amount"
              inputMode="decimal"
              onChange={(e) => setInjectionAmount(e.target.value)}
              placeholder="30.00"
              type="text"
              value={injectionAmount}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70" htmlFor="injection-description">
              Description <span className="text-white/40">(optional)</span>
            </label>
            <input
              className={inputClass}
              id="injection-description"
              onChange={(e) => setInjectionDescription(e.target.value)}
              placeholder="Manual correction"
              type="text"
              value={injectionDescription}
            />
          </div>
          <Button
            className="w-full"
            disabled={injectionLoading || !injectionUserId || !injectionAmount}
            onClick={() => void submitInjection()}
          >
            {injectionLoading ? 'Injecting…' : 'Inject Funds'}
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
