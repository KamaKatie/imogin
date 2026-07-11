export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex gap-3 mb-4">
          {["w-16", "w-24", "w-28"].map((w, i) => (
            <div key={i} className={`h-9 ${w} bg-muted rounded animate-pulse`} />
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
