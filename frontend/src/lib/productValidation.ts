import type {
  PriceConfig,
  PriceConfigCustomText,
  PriceConfigUnit,
  ProductPayload,
  SellingMode,
} from '@/types'

export interface ProductFormErrors {
  name?: string
  price_config?: string
}

function isMultipleOf(value: number, step: number): boolean {
  const remainder = value % step
  const epsilon = 1e-9
  return Math.abs(remainder) < epsilon || Math.abs(remainder - step) < epsilon
}

export function validateProductPayload(payload: ProductPayload): ProductFormErrors {
  const errors: ProductFormErrors = {}

  if (!payload.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (payload.selling_mode === 'custom_text') {
    const config = payload.price_config as PriceConfigCustomText
    if (config.flat_price < 0) {
      errors.price_config = 'Flat price must be zero or greater.'
    }
    if (!config.unit_label?.trim()) {
      errors.price_config = 'Unit label is required.'
    }
    return errors
  }

  const config = payload.price_config as PriceConfigUnit

  if (!config.step_value || config.step_value <= 0) {
    errors.price_config = 'Step value must be greater than zero.'
    return errors
  }

  if (!config.unit_label?.trim()) {
    errors.price_config = 'Unit label is required.'
    return errors
  }

  if (config.price_per_step < 0) {
    errors.price_config = 'Price per step must be zero or greater.'
    return errors
  }

  if (payload.selling_mode === 'unit' && config.allow_fractions) {
    errors.price_config = 'Unit products cannot allow fractions.'
  }

  return errors
}

export function isQuantityValid(
  priceConfig: PriceConfig,
  sellingMode: SellingMode,
  quantity: number,
): boolean {
  if (sellingMode === 'custom_text') return true

  const config = priceConfig as PriceConfigUnit
  const allowFractions = config.allow_fractions ?? false

  if (!allowFractions) {
    return isMultipleOf(quantity, config.step_value)
  }

  return quantity > 0
}
