import { createFileRoute, redirect } from '@tanstack/react-router'
import { ProductManager } from '@/components/admin/ProductManager'
import { useClubId } from '@/hooks/useAuth'
import { getSession } from '@/lib/storage'

export const Route = createFileRoute('/club/$clubId/_authenticated/admin/products')({
  beforeLoad: () => {
    const session = getSession()
    if (!session?.is_club_owner) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session?.club.id ?? 1) },
      })
    }
  },
  component: AdminProductsPage,
})

function AdminProductsPage() {
  const clubId = useClubId()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Products</h2>
      <ProductManager clubId={clubId} />
    </div>
  )
}
