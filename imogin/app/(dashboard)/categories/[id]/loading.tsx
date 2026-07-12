export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="rounded-xl border bg-card p-5">
        <div className="h-4 w-48 bg-muted rounded animate-pulse mb-3" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
