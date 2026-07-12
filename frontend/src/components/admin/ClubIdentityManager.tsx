import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { useTheme } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'
import type { ClubIdentity } from '@/types'

interface ClubIdentityManagerProps {
  clubId: number
}

type IdentityField = 'logo' | 'hero'

const fileInputClass = 'hidden'

export function ClubIdentityManager({ clubId }: ClubIdentityManagerProps) {
  const { toast } = useToast()
  const { applyTheme } = useTheme()
  const [identity, setIdentity] = useState<ClubIdentity | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingField, setUploadingField] = useState<IdentityField | null>(null)
  const [deletingField, setDeletingField] = useState<IdentityField | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await api.getClubIdentity(clubId)
    setIdentity(response.data)
    applyTheme(response.data.theme_config)
  }, [applyTheme, clubId])

  useEffect(() => {
    const init = async () => {
      try {
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load club identity')
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [load])

  const uploadFile = async (field: IdentityField, file: File | null) => {
    if (!file) return

    setUploadingField(field)
    try {
      const response =
        field === 'logo' ? await api.uploadClubLogo(clubId, file) : await api.uploadClubHero(clubId, file)
      setIdentity(response.data)
      applyTheme(response.data.theme_config)
      toast({ title: `${field === 'logo' ? 'Logo' : 'Hero image'} uploaded`, variant: 'success' })
    } catch (err) {
      toast({
        title: `${field === 'logo' ? 'Logo' : 'Hero image'} upload failed`,
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setUploadingField(null)
    }
  }

  const removeFile = async (field: IdentityField) => {
    setDeletingField(field)
    try {
      const response = field === 'logo' ? await api.deleteClubLogo(clubId) : await api.deleteClubHero(clubId)
      setIdentity(response.data)
      applyTheme(response.data.theme_config)
      toast({ title: `${field === 'logo' ? 'Logo' : 'Hero image'} removed`, variant: 'success' })
    } catch (err) {
      toast({
        title: `${field === 'logo' ? 'Logo' : 'Hero image'} removal failed`,
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setDeletingField(null)
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
            setError(null)
            void load()
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Failed to load club identity')
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

  return (
    <GlassPanel className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Club identity media</h3>
        <p className="text-sm text-white/60">Upload logo and hero visuals used throughout the experience.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <IdentityUploadCard
          altLabel="Club logo"
          deleting={deletingField === 'logo'}
          fileId="club-logo-upload"
          imageUrl={identity?.logo_image_url ?? null}
          onDelete={() => void removeFile('logo')}
          onSelectFile={(file) => void uploadFile('logo', file)}
          title="Logo"
          uploading={uploadingField === 'logo'}
        />
        <IdentityUploadCard
          altLabel="Club hero"
          deleting={deletingField === 'hero'}
          fileId="club-hero-upload"
          imageUrl={identity?.hero_image_url ?? null}
          onDelete={() => void removeFile('hero')}
          onSelectFile={(file) => void uploadFile('hero', file)}
          title="Hero image"
          uploading={uploadingField === 'hero'}
        />
      </div>
    </GlassPanel>
  )
}

interface IdentityUploadCardProps {
  title: string
  fileId: string
  imageUrl: string | null
  altLabel: string
  uploading: boolean
  deleting: boolean
  onSelectFile: (file: File | null) => void
  onDelete: () => void
}

function IdentityUploadCard({
  title,
  fileId,
  imageUrl,
  altLabel,
  uploading,
  deleting,
  onSelectFile,
  onDelete,
}: IdentityUploadCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-xs text-white/50">JPG, PNG, WEBP, AVIF - max 5MB</span>
      </div>

      <div className="mb-4 h-32 overflow-hidden rounded-lg border border-white/10 bg-black/40">
        {imageUrl ? (
          <img alt={altLabel} className="h-full w-full object-cover" src={imageUrl} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-white/35">
            No image
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <label className="flex-1">
          <input
            accept="image/jpeg,image/png,image/webp,image/avif"
            className={fileInputClass}
            id={fileId}
            onChange={(event) => {
              onSelectFile(event.target.files?.[0] ?? null)
              event.currentTarget.value = ''
            }}
            type="file"
          />
          <Button asChild className="w-full" disabled={uploading || deleting} size="sm" variant="outline">
            <span>{uploading ? 'Uploading…' : imageUrl ? 'Replace' : 'Upload'}</span>
          </Button>
        </label>
        <Button
          className="flex-1"
          disabled={!imageUrl || uploading || deleting}
          onClick={onDelete}
          size="sm"
          variant="destructive"
        >
          {deleting ? 'Removing…' : 'Remove'}
        </Button>
      </div>
    </div>
  )
}
