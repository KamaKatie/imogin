import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LazyMonthlyLineChart } from "@/components/lazy-monthly-chart"
import { getAppContext } from "@/lib/app-context"
import { getAccessibleAccountIds } from "@/lib/queries/accounts"

function getMonthRange() {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const start = new Date(now.getFullYear(), now.getMonth() - 23, 1)
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  }
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId, partnershipId } = ctx

  const allIds = await getAccessibleAccountIds(supabase, userId, partnershipId)

  let totalBalance = 0
  let totalSpent = 0
  let totalIncome = 0
  const monthlyTrend: Array<{ label: string; totalIncome: number; totalSpent: number }> = []

  if (allIds.length > 0) {
    const { start, end } = getMonthRange()

    const [accountsResult, txnsResult] = await Promise.all([
      supabase
        .from("accounts")
        .select("balance")
        .in("id", allIds),
      supabase
        .from("transactions")
        .select("amount, type, date")
        .in("account_id", allIds)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true }),
    ])

    totalBalance = accountsResult.data?.reduce((s, a) => s + (a.balance || 0), 0) || 0

    if (txnsResult.data) {
      const txns = txnsResult.data
      totalSpent = txns.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0)
      totalIncome = txns.filter(t => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0)

      const monthMap = new Map<string, { totalIncome: number; totalSpent: number }>()
      for (const t of txns) {
        const key = t.date.slice(0, 7)
        const entry = monthMap.get(key) || { totalIncome: 0, totalSpent: 0 }
        if (t.type === "income") entry.totalIncome += Math.abs(t.amount)
        else if (t.type === "expense") entry.totalSpent += Math.abs(t.amount)
        monthMap.set(key, entry)
      }

      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const label = d.toLocaleString("default", { month: "short", year: "2-digit" })
        const data = monthMap.get(key) || { totalIncome: 0, totalSpent: 0 }
        monthlyTrend.push({ label, ...data })
      }
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Spending overview for the last 24 months</p>

      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 md:p-5">
          <p className="text-xs md:text-sm text-muted-foreground">Balance</p>
          <p className="text-xl md:text-2xl font-bold mt-1">¥{totalBalance.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 md:p-5">
          <p className="text-xs md:text-sm text-muted-foreground">Spent</p>
          <p className="text-xl md:text-2xl font-bold mt-1 text-red-600">¥{totalSpent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 md:p-5">
          <p className="text-xs md:text-sm text-muted-foreground">Income</p>
          <p className="text-xl md:text-2xl font-bold mt-1 text-green-600">¥{totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 md:p-5">
          <p className="text-xs md:text-sm text-muted-foreground">Net</p>
          <p className={`text-xl md:text-2xl font-bold mt-1 ${totalIncome - totalSpent >= 0 ? "text-green-600" : "text-red-600"}`}>
            ¥{(totalIncome - totalSpent).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 md:p-5">
        <h2 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Monthly Overview</h2>
        <LazyMonthlyLineChart data={monthlyTrend} />
      </div>
    </div>
  )
}
