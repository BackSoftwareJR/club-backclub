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
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        className="glass-panel block p-5 transition hover:border-primary/30"
        params={{ clubId: String(clubId), productId: String(product.id) }}
        to="/club/$clubId/purchase/$productId"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-medium">{product.name}</h3>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs uppercase tracking-wide text-primary">
            {product.selling_mode.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-white/60">From {previewPrice}</p>
      </Link>
    </motion.div>
  )
}
