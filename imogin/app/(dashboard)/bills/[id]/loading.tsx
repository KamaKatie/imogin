export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}
