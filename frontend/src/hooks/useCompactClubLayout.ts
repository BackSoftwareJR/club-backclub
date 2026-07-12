import { useRouterState } from '@tanstack/react-router'

/** Full hero only on the member catalog home; compact header everywhere else. */
export function useCompactClubLayout(): boolean {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return !/\/club\/\d+\/?$/.test(pathname)
}
