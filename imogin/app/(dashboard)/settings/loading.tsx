export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
