import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { MemberManager } from '@/components/admin/MemberManager'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import { getSession } from '@/lib/storage'
import { useToast } from '@/providers/ToastProvider'
import type { Member } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/admin/members')({
  beforeLoad: () => {
    const session = getSession()
    if (!session?.is_club_owner) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session?.club.id ?? 1) },
      })
    }
  },
  component: AdminMembersPage,
})

function AdminMembersPage() {
  const clubId = useClubId()
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const loadMembers = useCallback(async () => {
    const response = await api.listMembers(clubId)
    setMembers(response.data ?? [])
  }, [clubId])

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
        setLoading(false)
      }
    }
    void load()
  }, [clubId, loadMembers, toast])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Members</h2>
      <MemberManager clubId={clubId} members={members} onRefresh={loadMembers} />
    </div>
  )
}
