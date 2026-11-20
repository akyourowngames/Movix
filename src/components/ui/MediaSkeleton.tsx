interface MediaSkeletonProps {
  count?: number
  variant?: 'poster' | 'landscape'
  label?: string
  className?: string
}

export function MediaSkeleton({
  count = 6,
  variant = 'poster',
  label = 'Loading titles',
  className = '',
}: MediaSkeletonProps) {
  const isPoster = variant === 'poster'

  return (
    <div
      className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${className}`}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-0" aria-hidden="true">
          <div className={`skeleton-surface mb-3 w-full rounded-lg ${isPoster ? 'aspect-[2/3]' : 'aspect-video'}`} />
          <div className="skeleton-surface mb-2 h-3.5 w-4/5 rounded" />
          <div className="skeleton-surface h-3 w-2/5 rounded" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <section className="page-shell min-h-[540px] pt-32 sm:min-h-[600px]" role="status" aria-label="Loading featured titles" aria-busy="true">
      <div className="max-w-xl pt-20">
        <div className="skeleton-surface mb-5 h-3 w-32 rounded" />
        <div className="skeleton-surface mb-3 h-12 w-full max-w-lg rounded sm:h-16" />
        <div className="skeleton-surface mb-2 h-12 w-4/5 max-w-md rounded sm:h-16" />
        <div className="skeleton-surface mt-6 h-4 w-full max-w-md rounded" />
        <div className="skeleton-surface mt-2 h-4 w-3/4 max-w-sm rounded" />
        <div className="mt-8 flex gap-3">
          <div className="skeleton-surface h-12 w-36 rounded-full" />
          <div className="skeleton-surface h-12 w-32 rounded-full" />
        </div>
      </div>
    </section>
  )
}
