import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemeConfig } from '@/types'
import { setSessionTheme } from '@/lib/storage'

interface ThemeContextValue {
  themeConfig: ThemeConfig | null
  applyTheme: (config: ThemeConfig) => void
  previewTheme: (config: ThemeConfig) => void
  clearThemePreview: () => void
  templateId: number
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function formatFontFamily(font: string): string {
  if (font.includes(',')) return font
  const isSerif = /playfair|georgia|times|merriweather|cormorant|garamond/i.test(font)
  return `'${font}', ${isSerif ? 'serif' : 'sans-serif'}`
}

export function applyThemeToDocument(config: ThemeConfig): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.colors.primary)
  root.style.setProperty('--color-secondary', config.colors.secondary)
  root.style.setProperty('--color-background', config.colors.background)
  root.style.setProperty('--glass-opacity', String(config.colors.glass_opacity))
  root.style.setProperty('--font-heading', formatFontFamily(config.typography.heading_font))
  root.style.setProperty('--font-body', formatFontFamily(config.typography.body_font))

  if (config.assets?.cover_url) {
    root.style.setProperty('--cover-image', `url(${config.assets.cover_url})`)
  } else {
    root.style.removeProperty('--cover-image')
  }
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode
  initialTheme?: ThemeConfig | null
}) {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(initialTheme ?? null)
  const [previewConfig, setPreviewConfig] = useState<ThemeConfig | null>(null)

  const applyTheme = useCallback((config: ThemeConfig) => {
    applyThemeToDocument(config)
    setPreviewConfig(null)
    setThemeConfig(config)
    setSessionTheme(config)
  }, [])

  const previewTheme = useCallback((config: ThemeConfig) => {
    applyThemeToDocument(config)
    setPreviewConfig(config)
  }, [])

  const clearThemePreview = useCallback(() => {
    setPreviewConfig(null)
    if (themeConfig) {
      applyThemeToDocument(themeConfig)
    }
  }, [themeConfig])

  useEffect(() => {
    if (initialTheme) {
      applyThemeToDocument(initialTheme)
    }
  }, [initialTheme])

  const value = useMemo(
    () => ({
      themeConfig,
      previewTheme,
      clearThemePreview,
      applyTheme,
      templateId: previewConfig?.template_id ?? themeConfig?.template_id ?? 1,
    }),
    [themeConfig, previewConfig, previewTheme, clearThemePreview, applyTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return ctx
}
