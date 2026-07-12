import { createFileRoute, redirect } from '@tanstack/react-router'
import { SecurityRadar } from '@/components/admin/SecurityRadar'
import { getSession } from '@/lib/storage'

export const Route = createFileRoute('/club/$clubId/_authenticated/admin/security')({
  beforeLoad: () => {
    const session = getSession()
    if (!session?.is_club_owner) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session?.club.id ?? 1) },
      })
    }
  },
  component: SecurityRadarPage,
})

function SecurityRadarPage() {
  const { clubId } = Route.useParams()
  return <SecurityRadar clubId={Number(clubId)} />
}
