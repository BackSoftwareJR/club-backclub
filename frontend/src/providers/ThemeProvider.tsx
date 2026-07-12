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

interface ThemeContextValue {
  themeConfig: ThemeConfig | null
  applyTheme: (config: ThemeConfig) => void
  templateId: number
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function applyThemeToDocument(config: ThemeConfig): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.colors.primary)
  root.style.setProperty('--color-secondary', config.colors.secondary)
  root.style.setProperty('--color-background', config.colors.background)
  root.style.setProperty('--glass-opacity', String(config.colors.glass_opacity))
  root.style.setProperty('--font-heading', config.typography.heading_font)
  root.style.setProperty('--font-body', config.typography.body_font)
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode
  initialTheme?: ThemeConfig | null
}) {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(initialTheme ?? null)

  const applyTheme = useCallback((config: ThemeConfig) => {
    applyThemeToDocument(config)
    setThemeConfig(config)
  }, [])

  useEffect(() => {
    if (initialTheme) {
      applyThemeToDocument(initialTheme)
    }
  }, [initialTheme])

  const value = useMemo(
    () => ({
      themeConfig,
      applyTheme,
      templateId: themeConfig?.template_id ?? 1,
    }),
    [themeConfig, applyTheme],
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
