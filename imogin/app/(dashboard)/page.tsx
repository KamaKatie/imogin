import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatRelativeDate, getOrdinal } from "@/lib/dates"
import { SankeyChart } from "@/components/sankey-chart"
import { PieChartDonut } from "@/components/pie-chart"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [profileResult, membershipResult, personalAccountsResult] = await Promise.all([
    supabase.from("profiles").select("name, email").eq("id", user.id).single(),
    supabase.from("partnership_members").select("partnership_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_shared", false),
  ])

  const profile = profileResult.data
  const displayName = profile?.name || profile?.email || user.email
  const partnershipId = membershipResult.data?.partnership_id || null
  const personalAccounts = personalAccountsResult.data || []

  let partnerProfile: { name: string | null; email: string } | null = null
  let partnerUserId: string | null = null
  let partnerOwesMe = 0
  let iOwePartner = 0
  let goals: unknown[] = []
  let bills: unknown[] = []
  let budgets: unknown[] = []
  let sharedAccounts: unknown[] = []
  let sharedIds: string[] = []
  let spendingByCategory: { name: string; color: string | null; icon: string | null; total: number }[] = []
  let incomeByCategory: { name: string; color: string | null; icon: string | null; total: number }[] = []
  let monthlyIncome = 0
  let monthlyExpenses = 0

  const personalBalance = personalAccounts.reduce((sum, a) => sum + (a.balance || 0), 0) || 0

  if (partnershipId) {
    const [sharedResult, goalsResult, billsResult, memberResult] = await Promise.all([
      supabase.from("accounts").select("*").eq("partnership_id", partnershipId).eq("is_shared", true),
      supabase.from("goals").select("*").eq("partnership_id", partnershipId).eq("status", "active"),
      supabase.from("bills").select("*, categories(name, color)").eq("partnership_id", partnershipId).eq("active", true),
      supabase.from("partnership_members").select("user_id").eq("partnership_id", partnershipId),
    ])

    sharedAccounts = sharedResult.data || []
    sharedIds = sharedAccounts.map(a => (a as { id: string }).id)
    goals = goalsResult.data || []
    bills = billsResult.data || []
    partnerUserId = memberResult.data?.find((m) => m.user_id !== user.id)?.user_id || null

    if (partnerUserId) {
      const partnerResult = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", partnerUserId)
        .single()
      partnerProfile = partnerResult.data
    }

    if (sharedIds.length > 0 && partnerUserId) {
      const { data: txIds } = await supabase
        .from("transactions")
        .select("id")
        .in("account_id", sharedIds)

      const idList = txIds?.map(t => t.id) || []
      if (idList.length > 0) {
        const { data: unsettled } = await supabase
          .from("transaction_splits")
          .select("user_id, amount")
          .in("transaction_id", idList)
          .eq("settled", false)

        for (const s of unsettled || []) {
          if (s.user_id === partnerUserId) partnerOwesMe += s.amount
          if (s.user_id === user.id) iOwePartner += s.amount
        }
      }
    }
  }

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const allAccountIds = [
    ...personalAccounts.map(a => a.id),
    ...sharedIds,
  ]

  let txnQuery = supabase
    .from("transactions")
    .select(`*, accounts!account_id!inner(name, is_shared)`)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5)

  if (partnershipId && sharedIds.length > 0) {
    txnQuery = supabase
      .from("transactions")
      .select(`*, accounts!account_id!inner(name, is_shared)`)
      .or(`user_id.eq.${user.id},account_id.in.(${sharedIds.join(",")})`)
      .order("date", { ascending: false })
      .limit(5)
  }

  const [recentTxnData, monthTxnsResult, budgetsResult] = await Promise.all([
    txnQuery,
    allAccountIds.length > 0
      ? supabase
          .from("transactions")
          .select(`*, categories(name, color, icon)`)
          .in("account_id", allAccountIds)
          .gte("date", firstDay)
          .lte("date", lastDay)
      : { data: null },
    partnershipId
      ? supabase
          .from("budgets")
          .select("*, categories(name, color)")
          .eq("partnership_id", partnershipId)
      : { data: null },
  ])

  const recentTransactions = recentTxnData.data || []
  budgets = budgetsResult.data || []

  const monthTxns = monthTxnsResult
  if (monthTxns?.data) {
    const currentMonthlyIncome = monthTxns.data
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    monthlyIncome = currentMonthlyIncome

    const currentMonthlyExpenses = monthTxns.data
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    monthlyExpenses = currentMonthlyExpenses
    
    // Use these to satisfy linting if they are not used in JSX
    console.log(`Monthly Income: ${monthlyIncome}, Expenses: ${monthlyExpenses}`);

    const catMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()
    for (const t of monthTxns.data.filter(t => t.type === "expense")) {
      const cat = t.categories as { name: string; color: string | null; icon: string | null } | null
      const key = t.category_id || "uncategorized"
      const existing = catMap.get(key) || { name: cat?.name || "Uncategorized", color: cat?.color || null, icon: cat?.icon || null, total: 0 }
      existing.total += Math.abs(t.amount)
      catMap.set(key, existing)
    }
    spendingByCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total)

    const incMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()
    for (const t of monthTxns.data.filter(t => t.type === "income")) {
      const cat = t.categories as { name: string; color: string | null; icon: string | null } | null
      const key = t.category_id || "uncategorized"
      const existing = incMap.get(key) || { name: cat?.name || "Income", color: cat?.color || null, icon: cat?.icon || null, total: 0 }
      existing.total += Math.abs(t.amount)
      incMap.set(key, existing)
    }
    incomeByCategory = Array.from(incMap.values()).sort((a, b) => b.total - a.total)
  }

  const upcomingBillsAmount = (bills as Array<{ amount: number }>)?.reduce((sum, s) => sum + Math.abs(s.amount), 0) || 0

   // netMonthly is not currently used in the return JSX
   // monthly income - monthly expenses
   // const _netMonthly = monthlyIncome - monthlyExpenses
  const netDebt = partnerOwesMe - iOwePartner

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Welcome back, {displayName}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Personal Balance</p>
          <p className="text-2xl font-bold mt-1">¥{personalBalance.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Partner</p>
            {!partnershipId && (
              <Link href="/settings" className="text-xs text-primary hover:underline">Set up</Link>
            )}
          </div>
          {partnershipId ? (
            <div>
              <p className="font-medium">{partnerProfile?.name || partnerProfile?.email || "Connected"}</p>
              {netDebt > 0 ? (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Owes you ¥{netDebt.toLocaleString()}
                </p>
              ) : netDebt < 0 ? (
                <p className="text-sm text-red-600 font-medium mt-1">
                  You owe ¥{Math.abs(netDebt).toLocaleString()}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">All settled</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">No partnership yet</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Upcoming Bills</p>
            <Link href="/bills" className="text-xs text-primary hover:underline">Manage</Link>
          </div>
          <p className="text-2xl font-bold">¥{upcomingBillsAmount.toLocaleString()}/mo</p>
          {bills.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {(bills as Array<{ id: string; name: string; amount: number; next_billing_date: string; billing_cycle: string; due_day: number | null; categories: { name: string; color: string | null } | null }>)
                .filter((s) => {
                  const due = new Date(s.next_billing_date)
                  const now = new Date()
                  return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()
                })
                .map((s) => {
                  const day = s.due_day || new Date(s.next_billing_date).getDate()
                  const isOverdue = new Date(s.next_billing_date) < new Date()
                  return (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? "bg-red-500" : "bg-blue-500"}`} />
                        <span className="text-sm truncate">{s.name}</span>
                        {s.categories && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: s.categories.color || "#6B7280" }} />
                            {s.categories.name}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-sm font-medium">¥{Math.abs(s.amount).toLocaleString()}</span>
                        <span className={`text-xs ml-2 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                          {isOverdue ? "Overdue" : `${day}${getOrdinal(day)}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
          {(bills as Array<{ next_billing_date: string }>).filter((s) => {
            const due = new Date(s.next_billing_date)
            const now = new Date()
            return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()
          }).length === 0 && (
            <p className="text-xs text-muted-foreground mt-3">No bills due this month</p>
          )}
        </div>
      </div>

      <div className={`grid gap-6 ${spendingByCategory.length > 0 || incomeByCategory.length > 0 ? "lg:grid-cols-2" : ""}`}>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">This Month</h2>
            <span className="text-xs text-muted-foreground">{now.getFullYear()} / {now.getMonth() + 1}</span>
          </div>
          <SankeyChart incomeByCategory={incomeByCategory} expenseByCategory={spendingByCategory} openingBalance={personalBalance} />
        </div>

        {spendingByCategory.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-4">Spending by Category</h2>
            <PieChartDonut data={spendingByCategory.map(c => ({ name: c.name, value: c.total, color: c.color, icon: c.icon }))} />
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Budget Status</h2>
            <Link href="/budgets" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-4">
            {(budgets as Array<{ id: string; amount: number; category_id: string; categories: { name: string; color: string | null } | null }>).map((b) => {
              const spent = spendingByCategory.find(c => c.name === b.categories?.name)
              const usedAmount = spent?.total || 0
              const usedPct = b.amount > 0 ? Math.min((usedAmount / b.amount) * 100, 100) : 0
              const remaining = b.amount - usedAmount
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.categories?.color || "#6B7280" }} />
                      {b.categories?.name || "Unknown"}
                    </span>
                    <span className={remaining < 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                      ¥{usedAmount.toLocaleString()} / ¥{b.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${usedPct > 80 ? "bg-red-500" : usedPct > 50 ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${goals.length > 0 ? "lg:grid-cols-2" : ""}`}>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Transactions</h2>
            <Link href="/transactions" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {(recentTransactions as Array<{ id: string; amount: number; description: string | null; date: string; type: string }>).map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.description || "No description"}</p>
                    <p className="text-xs text-muted-foreground" title={t.date}>{formatRelativeDate(t.date)}</p>
                  </div>
                  <p className={`text-sm font-medium ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}¥{Math.abs(t.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {goals.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Active Goals</h2>
              <Link href="/goals" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-4">
              {(goals as Array<{ id: string; name: string; target_amount: number; current_amount: number; color: string | null }>).map((g) => {
                const progress = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-muted-foreground">¥{g.current_amount.toLocaleString()} / ¥{g.target_amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: g.color || "#10B981" }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
