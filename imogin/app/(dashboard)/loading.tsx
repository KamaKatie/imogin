export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-48 bg-muted rounded animate-pulse" />

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
