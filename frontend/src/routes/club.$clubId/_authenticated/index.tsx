import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { CatalogSkeleton } from '@/components/ui/LuxurySkeleton'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import type { Product } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/')({
  component: CatalogPage,
})

function CatalogPage() {
  const clubId = useClubId()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getProducts(clubId)
        setProducts(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [clubId])

  if (loading) {
    return <CatalogSkeleton />
  }

  if (error) {
    return <p className="text-center text-red-400">{error}</p>
  }

  if (products.length === 0) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-2xl">Products</h2>
        <p className="text-white/50">No products available right now. Check back soon.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl">Products</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} clubId={clubId} product={product} />
        ))}
      </div>
    </div>
  )
}
