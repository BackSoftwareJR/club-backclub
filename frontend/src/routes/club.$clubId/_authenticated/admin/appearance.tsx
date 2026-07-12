import { createFileRoute, redirect } from '@tanstack/react-router'
import { ClubAppearanceManager } from '@/components/admin/ClubAppearanceManager'
import { ClubIdentityManager } from '@/components/admin/ClubIdentityManager'
import { useClubId } from '@/hooks/useAuth'
import { getSession } from '@/lib/storage'

export const Route = createFileRoute('/club/$clubId/_authenticated/admin/appearance')({
  beforeLoad: () => {
    const session = getSession()
    if (!session?.is_club_owner) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session?.club.id ?? 1) },
      })
    }
  },
  component: AdminAppearancePage,
})

function AdminAppearancePage() {
  const clubId = useClubId()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Aspetto</h2>
      <ClubAppearanceManager clubId={clubId} />
      <ClubIdentityManager clubId={clubId} />
    </div>
  )
}
