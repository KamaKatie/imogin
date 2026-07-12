export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-2 bg-muted rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
