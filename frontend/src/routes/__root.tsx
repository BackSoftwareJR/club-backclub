import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { getSession } from '@/lib/storage'

export const Route = createRootRoute({
  component: RootComponent,
})

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
