import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { MemberManager } from '@/components/admin/MemberManager'
import { Button } from '@/components/ui/Button'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import { getSession } from '@/lib/storage'
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
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setError(null)
    const response = await api.listMembers(clubId)
    setMembers(response.data ?? [])
  }, [clubId])

  useEffect(() => {
    const load = async () => {
      try {
        await loadMembers()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load members')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [loadMembers])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LuxurySpinner label="Loading members" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-red-400">{error}</p>
        <Button
          onClick={() => {
            setLoading(true)
            void loadMembers()
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Failed to load members')
              })
              .finally(() => setLoading(false))
          }}
        >
          Retry
        </Button>
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
