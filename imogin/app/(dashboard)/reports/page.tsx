import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportCharts } from "@/components/report-charts"
import { getPartnershipId } from "@/lib/queries"

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0]
  const lastDay = new Date(year, month, 0).toISOString().split("T")[0]

  const personalAccountIds = (await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_shared", false)).data?.map(a => a.id) || []

  let sharedAccountIds: string[] = []
  if (partnershipId) {
    sharedAccountIds = (await supabase
      .from("accounts")
      .select("id")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)).data?.map(a => a.id) || []
  }

  const allIds = [...new Set([...sharedAccountIds, ...personalAccountIds])]

  let byCategory: Array<{ category_id: string; name: string; color: string | null; icon: string | null; total: number }> = []
  let totalSpent = 0
  let totalIncome = 0
  const monthlyTrend: Array<{ month: number; totalSpent: number; totalIncome: number }> = []

  if (allIds.length > 0) {
    const { data: txns } = await supabase
      .from("transactions")
      .select(`
        *,
        categories(*)
      `)
      .in("account_id", allIds)
      .gte("date", firstDay)
      .lte("date", lastDay)

    const expenses = txns?.filter(t => t.type === "expense") || []
    const incomes = txns?.filter(t => t.type === "income") || []

    totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    totalIncome = incomes.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const categoryMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()
    for (const t of expenses) {
      const key = t.category_id || "uncategorized"
      const cat = t.categories as { name: string; color: string | null; icon: string | null } | null
      const existing = categoryMap.get(key) || {
        name: cat?.name || "Uncategorized",
        color: cat?.color || null,
        icon: cat?.icon || null,
        total: 0,
      }
      existing.total += Math.abs(t.amount)
      categoryMap.set(key, existing)
    }
    byCategory = Array.from(categoryMap.entries())
      .map(([id, data]) => ({ category_id: id, ...data }))
      .sort((a, b) => b.total - a.total)

    for (let m = 1; m <= 12; m++) {
      const fd = new Date(year, m - 1, 1).toISOString().split("T")[0]
      const ld = new Date(year, m, 0).toISOString().split("T")[0]

      const { data: monthTxns } = await supabase
        .from("transactions")
        .select("amount, type")
        .in("account_id", allIds)
        .gte("date", fd)
        .lte("date", ld)

      const monthExpenses = monthTxns?.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0) || 0
      const monthIncomes = monthTxns?.filter(t => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0) || 0

      monthlyTrend.push({ month: m, totalSpent: monthExpenses, totalIncome: monthIncomes })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Spending insights for {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-bold mt-1 text-red-600">¥{totalSpent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Income</p>
          <p className="text-2xl font-bold mt-1 text-green-600">¥{totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Net</p>
          <p className={`text-2xl font-bold mt-1 ${totalIncome - totalSpent >= 0 ? "text-green-600" : "text-red-600"}`}>
            ¥{(totalIncome - totalSpent).toLocaleString()}
          </p>
        </div>
      </div>

      <ReportCharts byCategory={byCategory} monthlyTrend={monthlyTrend} />
    </div>
  )
}
