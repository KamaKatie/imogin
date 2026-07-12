"use client"

import { useMemo } from "react"
import { formatRelativeDate, getOrdinal } from "@/lib/dates"
import { SankeyChart } from "@/components/lazy-sankey"
import { useAppContext } from "@/components/app-context-provider"
import { usePersonalAccounts } from "@/lib/hooks/use-personal-accounts"
import { useSharedAccounts } from "@/lib/hooks/use-shared-accounts"
import { usePartnerProfile } from "@/lib/hooks/use-partner-profile"
import { usePartnershipGoals } from "@/lib/hooks/use-partnership-goals"
import { useActiveBills } from "@/lib/hooks/use-active-bills"
import { useBudgetsWithSpending } from "@/lib/hooks/use-budgets-with-spending"
import { useRecentTransactions } from "@/lib/hooks/use-recent-transactions"
import { useMonthlyTransactions } from "@/lib/hooks/use-monthly-transactions"
import Link from "next/link"

export default function DashboardPage() {
  const { userId, partnershipId, partnerUserId, email, profile } = useAppContext()

  const { accounts: personalAccounts, isLoading: personalLoading } = usePersonalAccounts()
  const { accounts: sharedAccounts, isLoading: sharedLoading } = useSharedAccounts()
  const { profile: partnerProfile, isLoading: profileLoading } = usePartnerProfile()
  const { goals, isLoading: goalsLoading } = usePartnershipGoals()
  const { bills, isLoading: billsLoading } = useActiveBills()
  const { budgetsWithSpending, isLoading: budgetsLoading } = useBudgetsWithSpending()
  const { transactions: recentTransactions, isLoading: recentLoading } = useRecentTransactions()
  const { transactions: monthlyTransactions, isLoading: monthlyLoading } = useMonthlyTransactions()

  const isLoading = personalLoading || sharedLoading || profileLoading || goalsLoading || billsLoading || budgetsLoading || recentLoading || monthlyLoading

  const personalBalance = useMemo(
    () => personalAccounts.reduce((sum, a) => sum + (a.balance || 0), 0) || 0,
    [personalAccounts],
  )

  const { spendingByCategory, incomeByCategory } = useMemo(() => {
    const spendMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()
    for (const t of monthlyTransactions.filter((t: { type: string }) => t.type === "expense")) {
      const cat = t.categories as { name: string; color: string | null; icon: string | null } | null
      const key = t.category_id || "uncategorized"
      const existing = spendMap.get(key) || { name: cat?.name || "Uncategorized", color: cat?.color || null, icon: cat?.icon || null, total: 0 }
      existing.total += Math.abs(t.amount)
      spendMap.set(key, existing)
    }

    const incMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()
    for (const t of monthlyTransactions.filter((t: { type: string }) => t.type === "income")) {
      const cat = t.categories as { name: string; color: string | null; icon: string | null } | null
      const key = t.category_id || "uncategorized"
      const existing = incMap.get(key) || { name: cat?.name || "Income", color: cat?.color || null, icon: cat?.icon || null, total: 0 }
      existing.total += Math.abs(t.amount)
      incMap.set(key, existing)
    }

    return {
      spendingByCategory: Array.from(spendMap.values()).sort((a, b) => b.total - a.total),
      incomeByCategory: Array.from(incMap.values()).sort((a, b) => b.total - a.total),
    }
  }, [monthlyTransactions])

  const upcomingBillsAmount = useMemo(
    () => (bills as Array<{ amount: number }>)?.reduce((sum, s) => sum + Math.abs(s.amount), 0) || 0,
    [bills],
  )

  const now = new Date()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-7 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            <div className="h-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="h-5 w-36 bg-muted animate-pulse rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Welcome back, {profile?.name || profile?.email || email}</p>

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
              <p className="text-sm text-muted-foreground mt-1">All settled</p>
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
          <SankeyChart incomeByCategory={incomeByCategory} expenseByCategory={spendingByCategory} openingBalance={personalBalance} />
        </div>

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
      </div>

      {budgetsWithSpending.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Budget Status</h2>
            <Link href="/budgets" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-4">
            {(budgetsWithSpending as Array<{ id: string; amount: number; spent: number; categories: { name: string; color: string | null } | null }>).map((b) => {
              const usedPct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0
              const remaining = b.amount - b.spent
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.categories?.color || "#6B7280" }} />
                      {b.categories?.name || "Unknown"}
                    </span>
                    <span className={remaining < 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                      ¥{b.spent.toLocaleString()} / ¥{b.amount.toLocaleString()}
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
  )
}
