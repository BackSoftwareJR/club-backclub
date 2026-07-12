import { createFileRoute } from '@tanstack/react-router'
import { SettingsClubsPanel } from '@/components/settings/SettingsClubsPanel'

export const Route = createFileRoute('/club/$clubId/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Settings</h2>
        <p className="text-sm text-white/50">Manage your clubs and account.</p>
      </div>
      <SettingsClubsPanel />
    </div>
  )
}
