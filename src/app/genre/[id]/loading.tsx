export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-4 pb-32 pt-24 md:px-6" aria-busy="true" aria-label="Loading genre titles">
      <div className="container mx-auto animate-pulse">
        <div className="mb-12 space-y-3">
          <div className="h-12 w-56 rounded bg-white/5" />
          <div className="h-8 w-40 rounded bg-white/5" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index}>
              <div className="mb-3 aspect-[2/3] rounded-xl bg-white/5" />
              <div className="mb-2 h-4 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/3 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
