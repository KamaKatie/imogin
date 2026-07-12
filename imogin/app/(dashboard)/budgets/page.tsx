import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BudgetForm } from "@/components/budget-form"
import { getAppContext } from "@/lib/app-context"
import { getPartnershipCategories } from "@/lib/queries/categories"
import { getBudgetsWithCategories, getBudgetSpending } from "@/lib/queries/budgets"

export default async function BudgetsPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId, partnershipId } = ctx

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const [categories, budgets] = await Promise.all([
    getPartnershipCategories(supabase, partnershipId),
    getBudgetsWithCategories(supabase, userId, partnershipId),
  ])

  const categoryIds = (budgets || []).map(b => b.category_id).filter(Boolean)
  const txns = await getBudgetSpending(supabase, categoryIds, firstOfMonth, lastOfMonth)

  const budgetsWithSpending = (budgets || []).map((budget) => {
    let spent = 0
    for (const t of txns || []) {
      if (t.category_id !== budget.category_id) continue
      if (budget.user_id && t.user_id !== userId) continue
      spent += Math.abs(t.amount)
    }
    return { ...budget, spent }
  })

  const totalBudgeted = budgetsWithSpending.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Track spending limits</p>
        <BudgetForm hasPartner={!!partnershipId} categories={categories || []} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Budgeted</p>
          <p className="text-2xl font-bold mt-1">¥{totalBudgeted.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-bold mt-1">¥{totalSpent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className={`text-2xl font-bold mt-1 ${totalBudgeted - totalSpent < 0 ? "text-red-600" : "text-green-600"}`}>
            ¥{(totalBudgeted - totalSpent).toLocaleString()}
          </p>
        </div>
      </div>

      {budgetsWithSpending.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>No budgets yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgetsWithSpending.map((b) => {
            const percent = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0
            const isOver = b.spent > b.amount
            const catColor = (b.categories as { color: string | null } | null)?.color || "#4F46E5"

            return (
              <div key={b.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catColor }} />
                    <p className="font-medium">{(b.categories as { name: string } | null)?.name || "Unknown"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.user_id && <span className="text-xs text-primary">Personal</span>}
                    <p className="text-sm">{b.period}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>¥{b.spent.toLocaleString()} spent</span>
                    <span className={isOver ? "text-red-600 font-medium" : "text-muted-foreground"}>
                      ¥{b.amount.toLocaleString()} budgeted
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percent.toFixed(0)}% used</span>
                  {isOver ? (
                    <span className="text-red-600 font-medium">¥{(b.spent - b.amount).toLocaleString()} over</span>
                  ) : (
                    <span>¥{(b.amount - b.spent).toLocaleString()} remaining</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
