import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useLayoutEffect } from 'react'
import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { ghostRedirect } from '@/lib/ghost'
import { getEntryContext, getSession } from '@/lib/storage'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const session = getSession()
    const entryContext = getEntryContext()
    const isNfcEntry = /^\/entry\/\d+\/[^/]+\/?$/.test(location.pathname)
    const isEntryContinuation =
      entryContext !== null && (location.pathname === '/legal' || location.pathname === '/locked')

    if (!session && !isNfcEntry && !isEntryContinuation) {
      ghostRedirect({
        reportDirectAccess: true,
        attemptedRoute: `${location.pathname}${location.searchStr}`,
      })
    }
  },
  component: RootComponent,
  notFoundComponent: GhostNotFound,
})

function GhostNotFound() {
  useLayoutEffect(() => {
    ghostRedirect({ reportDirectAccess: true })
  }, [])

  return null
}

function RootComponent() {
  const session = getSession()

  return (
    <ThemeProvider initialTheme={session?.club.theme_config ?? null}>
      <AuthProvider>
        <ToastProvider>
          <Outlet />
          {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
