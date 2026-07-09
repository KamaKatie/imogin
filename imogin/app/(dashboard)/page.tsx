import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
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
  let subscriptions: unknown[] = []
  let recentTransactions: unknown[] = []

  const personalBalance = personalAccounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0

  if (partnershipId) {
    const sharedResult = await supabase
      .from("accounts")
      .select("*")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)
    sharedAccounts = sharedResult.data || []

    const txnResult = await supabase
      .from("transactions")
      .select(`*, accounts!inner(*)`)
      .in("account_id", sharedResult.data?.map(a => a.id) || [])
      .order("date", { ascending: false })
      .limit(5)
    recentTransactions = txnResult.data || []

    const goalsResult = await supabase
      .from("goals")
      .select("*")
      .eq("partnership_id", partnershipId)
      .eq("status", "active")
    goals = goalsResult.data || []

    const subsResult = await supabase
      .from("subscriptions")
      .select("*")
      .eq("partnership_id", partnershipId)
      .eq("active", true)
    subscriptions = subsResult.data || []
  }

  const sharedBalance = (sharedAccounts as Array<{ balance: number }>)?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0
  const upcomingSubsAmount = (subscriptions as Array<{ amount: number }>)?.reduce((sum, s) => sum + Math.abs(s.amount), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.email}</p>
      </div>

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
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Upcoming Subs</p>
          <p className="text-2xl font-bold mt-1">¥{upcomingSubsAmount.toLocaleString()}/mo</p>
        </div>
      </div>

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

      {subscriptions.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Subscriptions</h2>
            <Link href="/subscriptions" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(subscriptions as Array<{ id: string; name: string; amount: number; next_billing_date: string; billing_cycle: string }>).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Due {s.next_billing_date} &middot; {s.billing_cycle}</p>
                </div>
                <p className="text-sm font-medium">¥{Math.abs(s.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
