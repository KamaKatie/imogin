export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-muted rounded-xl animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
