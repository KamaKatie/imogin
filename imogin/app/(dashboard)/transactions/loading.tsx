export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex gap-3">
          <div className="h-9 w-64 bg-muted rounded animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
