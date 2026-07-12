import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageBreadcrumbs } from "@/lib/page-info"
import { getCategoryIcon } from "@/lib/icons"
import { getAccessibleAccountIds } from "@/lib/queries/accounts"
import { getCategoryById } from "@/lib/queries/categories"
import { LazyCategoryBarChart } from "@/components/lazy-category-chart"
import { CategoryEditButton } from "@/components/category-edit-button"
import { SimpleTransactionList } from "@/components/simple-transaction-list"
import { getAppContext } from "@/lib/app-context"

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId, partnershipId } = ctx
  if (!partnershipId) redirect("/categories")

  const category = await getCategoryById(supabase, id, partnershipId)

  if (!category) redirect("/categories")

  const accountIds = await getAccessibleAccountIds(supabase, userId, partnershipId)

  const [transactionsResult, trendResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(`*, accounts!account_id(id, name, is_shared)`)
      .eq("category_id", id)
      .in("account_id", accountIds)
      .order("date", { ascending: false })
      .limit(50),
    supabase
      .from("transactions")
      .select("amount, type, date")
      .eq("category_id", id)
      .in("account_id", accountIds)
      .gte("date", new Date(new Date().getFullYear(), new Date().getMonth() - 23, 1).toISOString().split("T")[0])
      .lte("date", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0])
      .order("date", { ascending: true }),
  ])

  const transactions = transactionsResult.data
  const trendTxns = trendResult.data

  const totalIncome = (transactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalExpense = (transactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const count = transactions?.length || 0

  const catColor = category.color || "#6B7280"

  const now = new Date()
  const monthlyTrend: Array<{ label: string; total: number }> = []

  if (trendTxns) {
    const monthMap = new Map<string, number>()
    for (const t of trendTxns) {
      const key = t.date.slice(0, 7)
      const existing = monthMap.get(key) || 0
      monthMap.set(key, existing + Math.abs(t.amount))
    }

    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" })
      monthlyTrend.push({ label, total: monthMap.get(key) || 0 })
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumbs
        items={[
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: catColor + "18" }}
            >
              <span style={{ color: catColor }}>
                {getCategoryIcon(category.icon, 24)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold">{category.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">{category.type}</p>
            </div>
          </div>
          <CategoryEditButton category={category} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-lg font-bold mt-1">{count}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="text-lg font-bold mt-1 text-green-600">
            ¥{totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Expense</p>
          <p className="text-lg font-bold mt-1 text-red-600">
            ¥{totalExpense.toLocaleString()}
          </p>
        </div>
      </div>

      {monthlyTrend.some(d => d.total > 0) && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Monthly Spending</h2>
          <LazyCategoryBarChart data={monthlyTrend} color={catColor} />
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Transactions</h2>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No transactions in this category yet
          </p>
        ) : (
          <SimpleTransactionList
            transactions={(transactions as unknown as Array<Record<string, unknown>>).map((t) => ({
              id: t.id as string,
              amount: t.amount as number,
              date: t.date as string,
              type: t.type as string,
              description: t.description as string | null,
              href: `/transactions/${t.id}`,
              subtitle: `${t.date} · ${(t.accounts as { name: string } | null)?.name || "Unknown"}`,
            }))}
          />
        )}
      </div>
    </div>
  )
}
