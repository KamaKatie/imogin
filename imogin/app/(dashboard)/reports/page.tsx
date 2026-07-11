import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MonthlyLineChart } from "@/components/monthly-line-chart"
import { getPartnershipId } from "@/lib/queries"

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

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

  let totalBalance = 0
  let totalSpent = 0
  let totalIncome = 0
  const monthlyTrend: Array<{ label: string; totalIncome: number; totalSpent: number }> = []

  if (allIds.length > 0) {
    const { data: accounts } = await supabase
      .from("accounts")
      .select("balance")
      .in("id", allIds)
    totalBalance = accounts?.reduce((s, a) => s + (a.balance || 0), 0) || 0

    const { start, end } = getMonthRange()

    const { data: txns } = await supabase
      .from("transactions")
      .select("amount, type, date")
      .in("account_id", allIds)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true })

    if (txns) {
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

      // const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const label = d.toLocaleString("default", { month: "short", year: "2-digit" })
        const data = monthMap.get(key) || { totalIncome: 0, totalSpent: 0 }
        monthlyTrend.push({ label, ...data })
      }
    }
  }

  const now = new Date()

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Spending overview for the last 12 months</p>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold mt-1">¥{totalBalance.toLocaleString()}</p>
        </div>
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

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Monthly Overview</h2>
        <MonthlyLineChart data={monthlyTrend} />
      </div>
    </div>
  )
}
