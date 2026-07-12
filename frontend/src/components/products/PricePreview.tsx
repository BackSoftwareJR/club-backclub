import { InvalidQuantityError, calculatePrice } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import type { PriceConfig, SellingMode } from '@/types'

interface PricePreviewProps {
  priceConfig: PriceConfig
  sellingMode: SellingMode
  quantity: number
}

export function PricePreview({ priceConfig, sellingMode, quantity }: PricePreviewProps) {
  let price: number | null = null
  let error: string | null = null

  try {
    price = calculatePrice(priceConfig, sellingMode, quantity)
  } catch (err) {
    if (err instanceof InvalidQuantityError) {
      error = err.message
    }
  }

  return (
    <div className="glass-panel flex items-center justify-between p-4">
      <span className="text-white/70">Total</span>
      {error ? (
        <span className="text-sm text-red-400">{error}</span>
      ) : (
        <span className="text-2xl font-semibold text-primary">
          {price !== null ? formatCurrency(price) : '—'}
        </span>
      )}
    </div>
  )
}
