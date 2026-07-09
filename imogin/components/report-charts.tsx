"use client"

interface CategoryData {
  category_id: string
  name: string
  color: string | null
  icon: string | null
  total: number
}

interface MonthlyData {
  month: number
  totalSpent: number
  totalIncome: number
}

interface ReportChartsProps {
  byCategory: CategoryData[]
  monthlyTrend: MonthlyData[]
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function ReportCharts({ byCategory, monthlyTrend }: ReportChartsProps) {
  const grandTotal = byCategory.reduce((sum, c) => sum + c.total, 0)

  const maxMonthlyValue = Math.max(
    ...monthlyTrend.map(m => Math.max(m.totalSpent, m.totalIncome)),
    1
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Spending by Category</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No spending data this month</p>
        ) : (
          <div className="space-y-3">
            {byCategory.map((c) => {
              const percent = grandTotal > 0 ? (c.total / grandTotal) * 100 : 0
              return (
                <div key={c.category_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || "#6B7280" }} />
                      <span>{c.name}</span>
                    </div>
                    <span className="font-medium">${c.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: c.color || "#6B7280" }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Monthly Trend ({new Date().getFullYear()})</h2>
        {monthlyTrend.every(m => m.totalSpent === 0 && m.totalIncome === 0) ? (
          <p className="text-sm text-muted-foreground">No data for this year</p>
        ) : (
          <div className="space-y-2">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{monthNames[m.month - 1]}</span>
                  <div className="flex gap-2">
                    <span className="text-green-600">${m.totalIncome.toFixed(0)}</span>
                    <span className="text-red-600">${m.totalSpent.toFixed(0)}</span>
                  </div>
                </div>
                <div className="flex gap-0.5 h-2">
                  <div
                    className="bg-green-500 rounded-l-full"
                    style={{ width: `${(m.totalIncome / maxMonthlyValue) * 50}%` }}
                  />
                  <div
                    className="bg-red-500 rounded-r-full"
                    style={{ width: `${(m.totalSpent / maxMonthlyValue) * 50}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
