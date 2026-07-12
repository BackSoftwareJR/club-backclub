import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CustomTextInput } from '@/components/products/CustomTextInput'
import { PricePreview } from '@/components/products/PricePreview'
import { UnitStepper } from '@/components/products/UnitStepper'
import { WeightSlider } from '@/components/products/WeightSlider'
import { AiFrictionModal } from '@/components/purchase/AiFrictionModal'
import { ConfirmModal } from '@/components/purchase/ConfirmModal'
import { InsufficientFundsModal } from '@/components/purchase/InsufficientFundsModal'
import { SuccessAnimation } from '@/components/purchase/SuccessAnimation'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { api } from '@/lib/api'
import { isApiRequestError } from '@/lib/apiErrors'
import { calculatePrice, defaultQuantity } from '@/lib/pricing'
import { useClubId } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'
import type { Product } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/purchase/$productId')({
  component: PurchasePage,
})

function formatQuantityLabel(product: Product, quantity: number): string {
  if (product.selling_mode === 'custom_text') {
    const config = product.price_config as { unit_label: string }
    return config.unit_label
  }

  const config = product.price_config as { step_value: number; unit_label: string }
  return `${quantity} ${config.unit_label}`
}

function PurchasePage() {
  const { productId } = Route.useParams()
  const clubId = useClubId()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customNote, setCustomNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [intervening, setIntervening] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [insufficientFundsOpen, setInsufficientFundsOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [success, setSuccess] = useState<{
    amount: string
    previousBalance: string
    newBalance: string
  } | null>(null)

  const purchaseInFlight = useRef(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const response = await api.getProducts(clubId)
        const found = response.data.find((p) => p.id === Number(productId))
        if (found) {
          setProduct(found)
          setQuantity(defaultQuantity(found.selling_mode, found.price_config))
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [clubId, productId])

  const total = useMemo(() => {
    if (!product) return 0
    try {
      return calculatePrice(product.price_config, product.selling_mode, quantity)
    } catch {
      return 0
    }
  }, [product, quantity])

  const isValid = useMemo(() => {
    if (!product) return false
    try {
      calculatePrice(product.price_config, product.selling_mode, quantity)
      return true
    } catch {
      return false
    }
  }, [product, quantity])

  const startPurchase = async () => {
    if (!product || !isValid || intervening || purchasing) return

    setIntervening(true)
    try {
      const ai = await api.aiIntervene(clubId, {
        product_id: product.id,
        quantity,
        custom_note: product.selling_mode === 'custom_text' ? customNote : null,
      })

      if (ai.intervention_required && ai.message) {
        setAiMessage(ai.message)
        setAiOpen(true)
        return
      }

      setConfirmOpen(true)
    } catch {
      setConfirmOpen(true)
    } finally {
      setIntervening(false)
    }
  }

  const executePurchase = async () => {
    if (!product || purchaseInFlight.current) return

    purchaseInFlight.current = true
    setPurchasing(true)

    try {
      const result = await api.purchase(clubId, {
        product_id: product.id,
        quantity,
        custom_note: product.selling_mode === 'custom_text' ? customNote : undefined,
      })

      const deducted = parseFloat(result.amount_deducted) || 0
      const newBalance = parseFloat(result.new_balance) || 0
      const previousBalance = (newBalance + deducted).toFixed(2)

      setConfirmOpen(false)
      setSuccess({
        amount: result.amount_deducted,
        previousBalance,
        newBalance: result.new_balance,
      })
    } catch (err) {
      if (isApiRequestError(err) && (err.status === 402 || err.code === 'insufficient_funds')) {
        setConfirmOpen(false)
        setInsufficientFundsOpen(true)
        return
      }

      if (isApiRequestError(err) && (err.status === 422 || err.code === 'invalid_quantity')) {
        toast({
          title: 'Invalid quantity',
          description: err.message,
          variant: 'error',
        })
        return
      }

      toast({
        title: 'Purchase failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setPurchasing(false)
      purchaseInFlight.current = false
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LuxurySpinner label="Loading product" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="text-center">
        <p className="mb-4 text-red-400">{loadError}</p>
        <Link className="text-primary underline" params={{ clubId: String(clubId) }} to="/club/$clubId">
          Back to catalog
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center">
        <p className="mb-4 text-red-400">Product not found.</p>
        <Link className="text-primary underline" params={{ clubId: String(clubId) }} to="/club/$clubId">
          Back to catalog
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="py-10">
        <SuccessAnimation
          amount={success.amount}
          newBalance={success.newBalance}
          previousBalance={success.previousBalance}
        />
        <div className="mt-6 text-center">
          <Link params={{ clubId: String(clubId) }} to="/club/$clubId">
            <Button variant="ghost">Back to catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  const unitConfig = product.price_config as {
    step_value: number
    unit_label: string
    allow_fractions?: boolean
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <GlassPanel>
        <Link
          className="mb-4 inline-block text-sm text-white/50 hover:text-white"
          params={{ clubId: String(clubId) }}
          to="/club/$clubId"
        >
          ← Back
        </Link>
        <h2 className="mb-6 text-2xl">{product.name}</h2>

        {product.selling_mode === 'custom_text' ? (
          <CustomTextInput onChange={setCustomNote} value={customNote} />
        ) : product.selling_mode === 'unit' || !unitConfig.allow_fractions ? (
          <UnitStepper
            min={unitConfig.step_value}
            onChange={setQuantity}
            step={unitConfig.step_value}
            unitLabel={unitConfig.unit_label}
            value={quantity}
          />
        ) : (
          <WeightSlider
            max={unitConfig.step_value * 20}
            min={unitConfig.step_value}
            onChange={setQuantity}
            step={unitConfig.step_value}
            unitLabel={unitConfig.unit_label}
            value={quantity}
          />
        )}
      </GlassPanel>

      <PricePreview
        priceConfig={product.price_config}
        quantity={quantity}
        sellingMode={product.selling_mode}
      />

      <Button
        className="w-full"
        disabled={
          !isValid ||
          intervening ||
          purchasing ||
          (product.selling_mode === 'custom_text' && !customNote.trim())
        }
        onClick={() => void startPurchase()}
      >
        {intervening ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Checking with Coach…
          </span>
        ) : (
          'Purchase'
        )}
      </Button>

      <AiFrictionModal
        message={aiMessage}
        onCancel={() => setAiOpen(false)}
        onContinue={() => {
          setAiOpen(false)
          setConfirmOpen(true)
        }}
        open={aiOpen}
      />

      <ConfirmModal
        customNote={product.selling_mode === 'custom_text' ? customNote : undefined}
        loading={purchasing}
        onConfirm={() => void executePurchase()}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        productName={product.name}
        quantityLabel={
          product.selling_mode === 'custom_text' ? undefined : formatQuantityLabel(product, quantity)
        }
        total={total}
      />

      <InsufficientFundsModal
        clubId={clubId}
        onOpenChange={setInsufficientFundsOpen}
        open={insufficientFundsOpen}
        total={total}
      />
    </div>
  )
}
