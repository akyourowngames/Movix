export default function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-24 sm:pt-28" role="status" aria-label="Loading title details" aria-busy="true">
      <div className="page-shell pt-12 md:pt-16">
        <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] md:gap-10 mb-12">
          <div className="skeleton-surface mx-auto aspect-[2/3] w-48 rounded-lg sm:w-56 md:mx-0 md:w-full" />
          <div className="space-y-4">
            <div className="skeleton-surface h-12 w-4/5 rounded" />
            <div className="skeleton-surface h-4 w-1/2 rounded" />
            <div className="flex gap-2">
              <div className="skeleton-surface h-7 w-20 rounded" />
              <div className="skeleton-surface h-7 w-24 rounded" />
            </div>
            <div className="skeleton-surface h-4 w-full rounded" />
            <div className="skeleton-surface h-4 w-5/6 rounded" />
            <div className="skeleton-surface h-4 w-3/4 rounded" />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <div className="skeleton-surface h-9 w-24 rounded" />
          <div className="skeleton-surface h-9 w-24 rounded" />
          <div className="skeleton-surface h-9 w-24 rounded" />
        </div>
        <div className="skeleton-surface aspect-video w-full rounded-lg" />
      </div>
    </main>
  )
}
