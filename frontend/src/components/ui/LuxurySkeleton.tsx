import { cn } from '@/lib/utils'

interface LuxurySkeletonProps {
  className?: string
}

export function LuxurySkeleton({ className }: LuxurySkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-white/5',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className,
      )}
    />
  )
}

export function CatalogSkeleton() {
  return (
    <div className="space-y-6">
      <LuxurySkeleton className="h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LuxurySkeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}

export function WalletSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <LuxurySkeleton className="h-40 rounded-2xl" />
      <LuxurySkeleton className="h-32 rounded-2xl" />
      <LuxurySkeleton className="h-56 rounded-2xl" />
    </div>
  )
}
