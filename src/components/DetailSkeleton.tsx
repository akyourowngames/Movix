export default function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <div className="container mx-auto px-4 md:px-6 pt-32 md:pt-40">
        <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-6 md:gap-8 mb-12 animate-pulse">
          <div className="w-48 sm:w-56 md:w-full aspect-[2/3] rounded-xl bg-white/5 mx-auto md:mx-0" />
          <div className="space-y-4">
            <div className="h-10 bg-white/5 rounded w-2/3" />
            <div className="h-4 bg-white/5 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-7 w-20 bg-white/5 rounded-full" />
              <div className="h-7 w-24 bg-white/5 rounded-full" />
            </div>
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
            <div className="h-4 bg-white/5 rounded w-3/4" />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <div className="h-9 w-24 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="aspect-video w-full bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </main>
  )
}
