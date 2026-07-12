import type { PriceConfig, SellingMode } from '@/types'

export class InvalidQuantityError extends Error {
  constructor(message = 'Quantity must be a multiple of the step value.') {
    super(message)
    this.name = 'InvalidQuantityError'
  }
}

export function calculatePrice(
  priceConfig: PriceConfig,
  sellingMode: SellingMode,
  quantity: number,
): number {
  if (sellingMode === 'custom_text') {
    return (priceConfig as { flat_price: number }).flat_price
  }

  const config = priceConfig as {
    step_value: number
    price_per_step: number
    allow_fractions?: boolean
  }

  const step = config.step_value
  const pricePerStep = config.price_per_step
  const allowFractions = config.allow_fractions ?? false

  if (!allowFractions && quantity % step !== 0) {
    throw new InvalidQuantityError()
  }

  return (quantity / step) * pricePerStep
}

export function defaultQuantity(sellingMode: SellingMode, priceConfig: PriceConfig): number {
  if (sellingMode === 'custom_text') return 1
  const config = priceConfig as { step_value: number }
  return config.step_value
}
