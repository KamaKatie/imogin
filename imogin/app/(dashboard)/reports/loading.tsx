export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 md:p-5 space-y-2">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-4 md:p-5">
        <div className="h-4 w-32 bg-muted rounded animate-pulse mb-4" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
