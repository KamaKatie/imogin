import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

function getOrdinal(n: number) {
  if (n > 3 && n < 21) return "th"
  switch (n % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th" }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single()

  const displayName = profile?.name || profile?.email || user.email

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id, share_code, user2_id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  const partnershipId = partnership?.id || null

  const { data: personalAccounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_shared", false)

  let sharedAccounts: unknown[] = []
  let goals: unknown[] = []
  let bills: unknown[] = []
  let recentTransactions: unknown[] = []

  const personalBalance = personalAccounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0

  let txnQuery = supabase
    .from("transactions")
    .select(`*, accounts!inner(name, is_shared)`)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5)

  if (partnershipId) {
    const sharedResult = await supabase
      .from("accounts")
      .select("id")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)
    const sharedIds = sharedResult.data?.map(a => a.id) || []

    if (sharedIds.length > 0) {
      txnQuery = supabase
        .from("transactions")
        .select(`*, accounts!inner(name, is_shared)`)
        .or(`user_id.eq.${user.id},account_id.in.(${sharedIds.join(",")})`)
        .order("date", { ascending: false })
        .limit(5)
    }

    const { data: sharedFull } = await supabase
      .from("accounts")
      .select("*")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)
    sharedAccounts = sharedFull || []

    const goalsResult = await supabase
      .from("goals")
      .select("*")
      .eq("partnership_id", partnershipId)
      .eq("status", "active")
    goals = goalsResult.data || []

    const billsResult = await supabase
      .from("bills")
      .select("*, categories(name, color)")
      .eq("partnership_id", partnershipId)
      .eq("active", true)
    bills = billsResult.data || []
  }

  const { data: recentTxnData } = await txnQuery
  recentTransactions = recentTxnData || []

  const sharedBalance = (sharedAccounts as Array<{ balance: number }>)?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0
  const upcomingBillsAmount = (bills as Array<{ amount: number }>)?.reduce((sum, s) => sum + Math.abs(s.amount), 0) || 0

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const allAccountIds = [
    ...(personalAccounts?.map(a => a.id) || []),
    ...(sharedAccounts as Array<{ id: string }>)?.map(a => a.id) || [],
  ]

  let monthlyIncome = 0
  let monthlyExpenses = 0
  let spendingByCategory: { name: string; color: string | null; total: number }[] = []
  let budgets: unknown[] = []
  let partnerProfile: { name: string | null; email: string } | null = null

  if (allAccountIds.length > 0) {
    const monthTxns = await supabase
      .from("transactions")
      .select(`*, categories(name, color)`)
      .in("account_id", allAccountIds)
      .gte("date", firstDay)
      .lte("date", lastDay)

    if (monthTxns.data) {
      monthlyIncome = monthTxns.data
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      monthlyExpenses = monthTxns.data
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      const catMap = new Map<string, { name: string; color: string | null; total: number }>()
      for (const t of monthTxns.data.filter(t => t.type === "expense")) {
        const cat = t.categories as { name: string; color: string | null } | null
        const key = t.category_id || "uncategorized"
        const existing = catMap.get(key) || { name: cat?.name || "Uncategorized", color: cat?.color || null, total: 0 }
        existing.total += Math.abs(t.amount)
        catMap.set(key, existing)
      }
      spendingByCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total)
    }

    if (partnershipId) {
      const budgetsResult = await supabase
        .from("budgets")
        .select("*, categories(name, color)")
        .eq("partnership_id", partnershipId)
      budgets = budgetsResult.data || []
    }

    if (partnership?.user2_id) {
      const partnerResult = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", partnership.user2_id)
        .single()
      partnerProfile = partnerResult.data
    }
  }

  const netMonthly = monthlyIncome - monthlyExpenses

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Welcome back, {displayName}</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Personal Balance</p>
          <p className="text-2xl font-bold mt-1">¥{personalBalance.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Shared Balance</p>
          <p className="text-2xl font-bold mt-1">¥{sharedBalance.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Active Goals</p>
          <p className="text-2xl font-bold mt-1">{goals.length}</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">This Month</h2>
            <span className="text-xs text-muted-foreground">{now.getFullYear()} / {now.getMonth() + 1}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-lg font-bold text-green-600">+¥{monthlyIncome.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-lg font-bold text-red-600">-¥{monthlyExpenses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net</p>
              <p className={`text-lg font-bold ${netMonthly >= 0 ? "text-green-600" : "text-red-600"}`}>
                {netMonthly >= 0 ? "+" : "-"}¥{Math.abs(netMonthly).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Partnership</h2>
            {!partnershipId && (
              <Link href="/settings" className="text-sm text-primary hover:underline">Set up</Link>
            )}
          </div>
          {partnershipId ? (
            <div className="space-y-2">
              {partnerProfile ? (
                <div>
                  <p className="text-sm text-muted-foreground">Partner</p>
                  <p className="font-medium">{partnerProfile.name || partnerProfile.email}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="font-medium">You have a partnership</p>
                </div>
              )}
              {partnership?.share_code && (
                <div>
                  <p className="text-sm text-muted-foreground">Share Code</p>
                  <p className="font-mono text-sm font-medium">{partnership.share_code}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">No partnership yet</p>
              <p className="text-xs text-muted-foreground mt-1">Go to Settings to create or join a partnership</p>
            </div>
          )}
        </div>
      </div>

      {spendingByCategory.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Spending by Category</h2>
          <div className="space-y-3">
            {spendingByCategory.map((cat, i) => {
              const pct = monthlyExpenses > 0 ? (cat.total / monthlyExpenses) * 100 : 0
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || "#6B7280" }} />
                      {cat.name}
                    </span>
                    <span className="font-medium">¥{cat.total.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: cat.color || "#6B7280" }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      <div className="grid gap-6 lg:grid-cols-2">
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
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                  <p className={`text-sm font-medium ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}¥{Math.abs(t.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Active Goals</h2>
            <Link href="/goals" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No goals yet</p>
          ) : (
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
          )}
        </div>
      </div>


    </div>
  )
}
