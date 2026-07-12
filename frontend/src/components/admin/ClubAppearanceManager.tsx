import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'
import type { ClubAppearancePayload, ClubIdentity, ThemeConfig } from '@/types'

interface ClubAppearanceManagerProps {
  clubId: number
}

type TypographyPreset = 'elegant_serif' | 'modern_sans'

interface AppearanceDraft {
  template_id: number
  colors: {
    primary: string
    secondary: string
    background: string
  }
  typographyPreset: TypographyPreset
  interactions: {
    sounds_enabled: boolean
    haptics_enabled: boolean
  }
}

const templateOptions = [
  { id: 1, label: 'Classic Lounge' },
  { id: 2, label: 'Modern Edge' },
  { id: 3, label: 'Cinematic Velvet' },
  { id: 4, label: 'Minimal Atelier' },
] as const

function detectTypographyPreset(themeConfig: ThemeConfig): TypographyPreset {
  if (themeConfig.typography.preset) {
    return themeConfig.typography.preset
  }

  const heading = themeConfig.typography.heading_font.toLowerCase()
  const body = themeConfig.typography.body_font.toLowerCase()

  if (heading.includes('inter') || body.includes('helvetica') || body.includes('arial')) {
    return 'modern_sans'
  }

  return 'elegant_serif'
}

function toDraft(themeConfig: ThemeConfig): AppearanceDraft {
  return {
    template_id: themeConfig.template_id ?? 1,
    colors: {
      primary: themeConfig.colors.primary,
      secondary: themeConfig.colors.secondary,
      background: themeConfig.colors.background,
    },
    typographyPreset: detectTypographyPreset(themeConfig),
    interactions: {
      sounds_enabled: themeConfig.interactions?.sounds_enabled ?? true,
      haptics_enabled: themeConfig.interactions?.haptics_enabled ?? true,
    },
  }
}

function toPayload(draft: AppearanceDraft): ClubAppearancePayload {
  return {
    template_id: draft.template_id,
    colors: draft.colors,
    typography: {
      preset: draft.typographyPreset,
    },
    interactions: draft.interactions,
  }
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export function ClubAppearanceManager({ clubId }: ClubAppearanceManagerProps) {
  const { toast } = useToast()
  const { themeConfig, applyTheme, previewTheme, clearThemePreview } = useTheme()
  const [identity, setIdentity] = useState<ClubIdentity | null>(null)
  const [draft, setDraft] = useState<AppearanceDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadIdentity = useCallback(async () => {
    setError(null)
    const response = await api.getClubIdentity(clubId)
    setIdentity(response.data)
    setDraft(toDraft(response.data.theme_config))
    applyTheme(response.data.theme_config)
  }, [applyTheme, clubId])

  useEffect(() => {
    const init = async () => {
      try {
        await loadIdentity()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load appearance settings')
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [loadIdentity])

  const baselineDraft = useMemo(() => {
    if (!identity) return null
    return toDraft(identity.theme_config)
  }, [identity])

  const isDirty = useMemo(() => {
    if (!draft || !baselineDraft) return false
    return JSON.stringify(draft) !== JSON.stringify(baselineDraft)
  }, [draft, baselineDraft])

  const hasInvalidColors = useMemo(() => {
    if (!draft) return true
    return !Object.values(draft.colors).every(isHexColor)
  }, [draft])

  useEffect(() => {
    if (!draft || !identity) return

    if (!isDirty) {
      clearThemePreview()
      return
    }

    previewTheme({
      ...identity.theme_config,
      template_id: draft.template_id,
      colors: {
        ...identity.theme_config.colors,
        ...draft.colors,
      },
      typography: {
        ...identity.theme_config.typography,
        preset: draft.typographyPreset,
      },
      interactions: draft.interactions,
    })
  }, [draft, identity, isDirty, previewTheme, clearThemePreview])

  useEffect(
    () => () => {
      clearThemePreview()
      if (themeConfig) {
        applyTheme(themeConfig)
      }
    },
    [clearThemePreview, applyTheme, themeConfig],
  )

  const resetDraft = () => {
    if (!identity) return
    setDraft(toDraft(identity.theme_config))
    clearThemePreview()
  }

  const save = async () => {
    if (!draft || hasInvalidColors) return

    setSaving(true)
    try {
      const response = await api.updateClubAppearance(clubId, toPayload(draft))
      setIdentity(response.data)
      setDraft(toDraft(response.data.theme_config))
      applyTheme(response.data.theme_config)
      toast({ title: 'Aspetto aggiornato', description: 'Tema e template salvati con successo.', variant: 'success' })
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <GlassPanel className="flex justify-center py-10">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </GlassPanel>
    )
  }

  if (error) {
    return (
      <GlassPanel className="space-y-3 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Button
          onClick={() => {
            setLoading(true)
            void loadIdentity()
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Failed to load appearance settings')
              })
              .finally(() => setLoading(false))
          }}
          size="sm"
          variant="outline"
        >
          Retry
        </Button>
      </GlassPanel>
    )
  }

  if (!draft) return null

  return (
    <GlassPanel className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium">Aspetto</h3>
          <p className="text-sm text-white/60">
            Anteprima live attiva: le modifiche si vedono subito, ma restano locali finche non salvi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled={!isDirty || saving} onClick={resetDraft} size="sm" variant="ghost">
            Annulla modifiche
          </Button>
          <Button disabled={!isDirty || hasInvalidColors || saving} onClick={() => void save()} size="sm">
            {saving ? 'Salvataggio…' : 'Salva aspetto'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <h4 className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">Colori</h4>
          <ColorControl
            label="Primary"
            onChange={(value) => setDraft((prev) => (prev ? { ...prev, colors: { ...prev.colors, primary: value } } : prev))}
            value={draft.colors.primary}
          />
          <ColorControl
            label="Secondary"
            onChange={(value) =>
              setDraft((prev) => (prev ? { ...prev, colors: { ...prev.colors, secondary: value } } : prev))
            }
            value={draft.colors.secondary}
          />
          <ColorControl
            label="Background"
            onChange={(value) =>
              setDraft((prev) => (prev ? { ...prev, colors: { ...prev.colors, background: value } } : prev))
            }
            value={draft.colors.background}
          />
        </section>

        <section className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <h4 className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">Tipografia</h4>
          <div className="grid gap-2">
            <PresetOption
              description="Playfair + Cormorant with deep serif fallbacks"
              isActive={draft.typographyPreset === 'elegant_serif'}
              label="Elegant Serif"
              onClick={() => setDraft((prev) => (prev ? { ...prev, typographyPreset: 'elegant_serif' } : prev))}
            />
            <PresetOption
              description="Inter stack with modern sans fallbacks"
              isActive={draft.typographyPreset === 'modern_sans'}
              label="Modern Sans"
              onClick={() => setDraft((prev) => (prev ? { ...prev, typographyPreset: 'modern_sans' } : prev))}
            />
          </div>

          <h4 className="pt-2 text-sm font-medium uppercase tracking-[0.2em] text-white/60">Feedback acquisto</h4>
          <ToggleLine
            checked={draft.interactions.sounds_enabled}
            label="Suono conferma"
            onChange={(checked) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, interactions: { ...prev.interactions, sounds_enabled: checked } }
                  : prev,
              )
            }
          />
          <ToggleLine
            checked={draft.interactions.haptics_enabled}
            label="Haptic feedback"
            onChange={(checked) =>
              setDraft((prev) =>
                prev
                  ? { ...prev, interactions: { ...prev.interactions, haptics_enabled: checked } }
                  : prev,
              )
            }
          />
        </section>
      </div>

      <section className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <h4 className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">Template</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {templateOptions.map((option) => (
            <button
              key={option.id}
              className={cn(
                'rounded-xl border px-4 py-3 text-left text-sm transition',
                draft.template_id === option.id
                  ? 'border-primary/70 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              )}
              onClick={() => setDraft((prev) => (prev ? { ...prev, template_id: option.id } : prev))}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </GlassPanel>
  )
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 text-sm text-white/70">{label}</label>
      <input
        aria-label={`${label} color`}
        className="h-9 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        type="color"
        value={isHexColor(value) ? value : '#000000'}
      />
      <input
        className={cn(
          'h-9 flex-1 rounded-lg border bg-black/30 px-3 text-sm uppercase tracking-wider outline-none',
          isHexColor(value) ? 'border-white/20 focus:border-primary/60' : 'border-red-400/60 focus:border-red-400',
        )}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        placeholder="#FFFFFF"
        value={value}
      />
    </div>
  )
}

function PresetOption({
  label,
  description,
  isActive,
  onClick,
}: {
  label: string
  description: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'rounded-xl border px-4 py-3 text-left transition',
        isActive ? 'border-primary/70 bg-primary/15' : 'border-white/10 bg-white/5 hover:bg-white/10',
      )}
      onClick={onClick}
      type="button"
    >
      <p className="text-sm">{label}</p>
      <p className="mt-1 text-xs text-white/50">{description}</p>
    </button>
  )
}

function ToggleLine({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  )
}
