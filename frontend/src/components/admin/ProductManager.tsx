import { useEffect, useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import { calculatePrice, defaultQuantity } from '@/lib/pricing'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type {
  PriceConfig,
  PriceConfigCustomText,
  PriceConfigUnit,
  Product,
  ProductPayload,
  SellingMode,
} from '@/types'

interface ProductManagerProps {
  clubId: number
}

interface ProductFormState {
  name: string
  selling_mode: SellingMode
  price_config: PriceConfig
  is_active: boolean
}

const SELLING_MODES: { value: SellingMode; label: string }[] = [
  { value: 'unit', label: 'Unit' },
  { value: 'weight', label: 'Weight' },
  { value: 'volume', label: 'Volume' },
  { value: 'custom_text', label: 'Custom text' },
]

function defaultPriceConfig(mode: SellingMode): PriceConfig {
  switch (mode) {
    case 'custom_text':
      return { flat_price: 0, unit_label: 'note' }
    case 'weight':
      return { step_value: 100, unit_label: 'g', price_per_step: 0, allow_fractions: true }
    case 'volume':
      return { step_value: 50, unit_label: 'ml', price_per_step: 0, allow_fractions: true }
    default:
      return { step_value: 1, unit_label: 'pcs', price_per_step: 0, allow_fractions: false }
  }
}

function emptyForm(): ProductFormState {
  return {
    name: '',
    selling_mode: 'unit',
    price_config: defaultPriceConfig('unit'),
    is_active: true,
  }
}

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    selling_mode: product.selling_mode,
    price_config: product.price_config,
    is_active: product.is_active,
  }
}

function formatProductPrice(product: Product): string {
  try {
    const qty = defaultQuantity(product.selling_mode, product.price_config)
    return formatCurrency(calculatePrice(product.price_config, product.selling_mode, qty))
  } catch {
    return '—'
  }
}

const inputClass =
  'glass-panel w-full rounded-xl border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary/30'

export function ProductManager({ clubId }: ProductManagerProps) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  const load = async () => {
    const response = await api.getProducts(clubId)
    setProducts(response.data)
  }

  useEffect(() => {
    const init = async () => {
      try {
        await load()
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [clubId])

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm(productToForm(product))
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
  }

  const setSellingMode = (mode: SellingMode) => {
    setForm((prev) => ({
      ...prev,
      selling_mode: mode,
      price_config: defaultPriceConfig(mode),
    }))
  }

  const updateUnitConfig = (patch: Partial<PriceConfigUnit>) => {
    setForm((prev) => ({
      ...prev,
      price_config: { ...(prev.price_config as PriceConfigUnit), ...patch },
    }))
  }

  const updateCustomConfig = (patch: Partial<PriceConfigCustomText>) => {
    setForm((prev) => ({
      ...prev,
      price_config: { ...(prev.price_config as PriceConfigCustomText), ...patch },
    }))
  }

  const buildPayload = (): ProductPayload => ({
    name: form.name.trim(),
    selling_mode: form.selling_mode,
    price_config: form.price_config,
    is_active: form.is_active,
  })

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name is required', variant: 'error' })
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload()
      if (editingProduct) {
        await api.updateProduct(clubId, editingProduct.id, payload)
        toast({ title: 'Product updated', variant: 'success' })
      } else {
        await api.createProduct(clubId, payload)
        toast({ title: 'Product created', variant: 'success' })
      }
      closeModal()
      await load()
    } catch (err) {
      toast({
        title: editingProduct ? 'Update failed' : 'Create failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (productId: number) => {
    setDeactivatingId(productId)
    try {
      await api.deleteProduct(clubId, productId)
      toast({ title: 'Product deactivated', variant: 'success' })
      await load()
    } catch (err) {
      toast({
        title: 'Deactivation failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setDeactivatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-white/50">{products.length} active product{products.length !== 1 ? 's' : ''}</p>
        <Button onClick={openCreate}>Add product</Button>
      </div>

      {products.length === 0 ? (
        <GlassPanel className="text-center text-white/50">No active products. Create one to get started.</GlassPanel>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <GlassPanel key={product.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-white/50">
                  {product.selling_mode.replace('_', ' ')} · from {formatProductPrice(product)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs',
                    product.is_active
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400',
                  )}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
                <Button onClick={() => openEdit(product)} size="sm" variant="outline">
                  Edit
                </Button>
                <Button
                  disabled={deactivatingId === product.id}
                  onClick={() => void deactivate(product.id)}
                  size="sm"
                  variant="destructive"
                >
                  Deactivate
                </Button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <Modal
        className="w-[min(92vw,520px)]"
        description={editingProduct ? 'Update product details and pricing.' : 'Add a new product to the catalog.'}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
        open={modalOpen}
        title={editingProduct ? 'Edit product' : 'New product'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/60" htmlFor="product-name">
              Name
            </label>
            <input
              className={inputClass}
              id="product-name"
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Product name"
              value={form.name}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60" htmlFor="selling-mode">
              Selling mode
            </label>
            <select
              className={inputClass}
              id="selling-mode"
              onChange={(e) => setSellingMode(e.target.value as SellingMode)}
              value={form.selling_mode}
            >
              {SELLING_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {form.selling_mode === 'custom_text' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-white/60" htmlFor="flat-price">
                  Flat price (€)
                </label>
                <input
                  className={inputClass}
                  id="flat-price"
                  min="0"
                  onChange={(e) => updateCustomConfig({ flat_price: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  type="number"
                  value={(form.price_config as PriceConfigCustomText).flat_price}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60" htmlFor="custom-unit-label">
                  Unit label
                </label>
                <input
                  className={inputClass}
                  id="custom-unit-label"
                  onChange={(e) => updateCustomConfig({ unit_label: e.target.value })}
                  placeholder="note"
                  value={(form.price_config as PriceConfigCustomText).unit_label}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-white/60" htmlFor="step-value">
                  Step value
                </label>
                <input
                  className={inputClass}
                  id="step-value"
                  min="0.01"
                  onChange={(e) => updateUnitConfig({ step_value: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  type="number"
                  value={(form.price_config as PriceConfigUnit).step_value}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60" htmlFor="unit-label">
                  Unit label
                </label>
                <input
                  className={inputClass}
                  id="unit-label"
                  onChange={(e) => updateUnitConfig({ unit_label: e.target.value })}
                  placeholder="pcs"
                  value={(form.price_config as PriceConfigUnit).unit_label}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60" htmlFor="price-per-step">
                  Price per step (€)
                </label>
                <input
                  className={inputClass}
                  id="price-per-step"
                  min="0"
                  onChange={(e) => updateUnitConfig({ price_per_step: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  type="number"
                  value={(form.price_config as PriceConfigUnit).price_per_step}
                />
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <input
                    checked={(form.price_config as PriceConfigUnit).allow_fractions ?? false}
                    className="accent-primary"
                    onChange={(e) => updateUnitConfig({ allow_fractions: e.target.checked })}
                    type="checkbox"
                  />
                  <span className="text-sm text-white/80">Allow fractions</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-white/50">Visible in the member catalog</p>
            </div>
            <Switch.Root
              checked={form.is_active}
              className="relative h-6 w-11 rounded-full bg-white/10 data-[state=checked]:bg-primary/80"
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={closeModal} variant="ghost">
              Cancel
            </Button>
            <Button className="flex-1" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : editingProduct ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
