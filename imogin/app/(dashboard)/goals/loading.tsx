export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full animate-pulse" />
            <div className="flex justify-between">
              <div className="h-2.5 w-20 bg-muted rounded animate-pulse" />
              <div className="h-2.5 w-12 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
