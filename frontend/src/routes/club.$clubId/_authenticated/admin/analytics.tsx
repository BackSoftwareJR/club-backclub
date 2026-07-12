import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { AdminAnalyticsDashboard } from '@/components/admin/AdminAnalyticsDashboard'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import { getSession } from '@/lib/storage'
import type { AdminAnalyticsResponse } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/admin/analytics')({
  beforeLoad: () => {
    const session = getSession()
    if (!session?.is_club_owner) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session?.club.id ?? 1) },
      })
    }
  },
  component: AdminAnalyticsPage,
})

function AdminAnalyticsPage() {
  const clubId = useClubId()
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    setError(null)
    const data = await api.getAdminAnalytics(clubId)
    setAnalytics(data)
  }, [clubId])

  useEffect(() => {
    const load = async () => {
      try {
        await loadAnalytics()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [loadAnalytics])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LuxurySpinner label="Loading analytics" />
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
            void loadAnalytics()
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Failed to load analytics')
              })
              .finally(() => setLoading(false))
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Analytics</h2>
      <AdminAnalyticsDashboard analytics={analytics} />
    </div>
  )
}
