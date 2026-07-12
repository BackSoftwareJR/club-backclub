import { createFileRoute } from '@tanstack/react-router'
import { SettingsClubsPanel } from '@/components/settings/SettingsClubsPanel'

export const Route = createFileRoute('/club/$clubId/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Impostazioni</h2>
        <p className="text-sm text-white/50">
          Cambia club, passa ad Admin e gestisci prodotti e membri da telefono.
        </p>
      </div>
      <SettingsClubsPanel />
    </div>
  )
}
