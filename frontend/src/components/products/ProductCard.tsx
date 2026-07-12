import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import type { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { calculatePrice, defaultQuantity } from '@/lib/pricing'

interface ProductCardProps {
  product: Product
  clubId: number
}

export function ProductCard({ product, clubId }: ProductCardProps) {
  let previewPrice = '—'
  try {
    const qty = defaultQuantity(product.selling_mode, product.price_config)
    previewPrice = formatCurrency(calculatePrice(product.price_config, product.selling_mode, qty))
  } catch {
    previewPrice = '—'
  }

  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} transition={{ duration: 0.22 }}>
      <Link
        className="glass-panel group relative block overflow-hidden rounded-2xl border border-white/10 p-0 transition hover:border-primary/35"
        params={{ clubId: String(clubId), productId: String(product.id) }}
        to="/club/$clubId/purchase/$productId"
      >
        <div className="relative h-36">
          {product.cover_image_url ? (
            <img
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={product.cover_image_url}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-black/70 to-black text-xs uppercase tracking-[0.2em] text-white/45">
              Signature selection
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <h3 className="line-clamp-2 text-lg font-medium text-white">{product.name}</h3>
            <span className="rounded-full border border-primary/35 bg-black/50 px-2 py-0.5 text-xs uppercase tracking-wide text-primary backdrop-blur-md">
              {product.selling_mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="space-y-1 p-4">
          <p className="text-sm text-white/70">From {previewPrice}</p>
          {product.gallery.length > 0 ? (
            <p className="text-xs text-white/45">{product.gallery.length} gallery image{product.gallery.length > 1 ? 's' : ''}</p>
          ) : (
            <p className="text-xs text-white/40">No gallery yet</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
