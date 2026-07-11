import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageBreadcrumbs } from "@/lib/page-info"
import { getCategoryIcon } from "@/lib/icons"
import { getPartnershipId, getAccessibleAccountIds } from "@/lib/queries"
import { CategoryBarChart } from "@/components/category-bar-chart"
import { CategoryEditButton } from "@/components/category-edit-button"

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) redirect("/categories")

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("partnership_id", partnershipId)
    .single()

  if (!category) redirect("/categories")

  const accountIds = await getAccessibleAccountIds(supabase, user.id, partnershipId)

  const { data: transactions } = await supabase
    .from("transactions")
    .select(`*, accounts!account_id(id, name, is_shared)`)
    .eq("category_id", id)
    .in("account_id", accountIds)
    .order("date", { ascending: false })
    .limit(50)

  const totalIncome = (transactions || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalExpense = (transactions || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const count = transactions?.length || 0

  const catColor = category.color || "#6B7280"

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 23, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: trendTxns } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .eq("category_id", id)
    .in("account_id", accountIds)
    .gte("date", monthStart.toISOString().split("T")[0])
    .lte("date", monthEnd.toISOString().split("T")[0])
    .order("date", { ascending: true })

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
          <CategoryBarChart data={monthlyTrend} color={catColor} />
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Transactions</h2>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No transactions in this category yet
          </p>
        ) : (
          <div className="space-y-2">
            {(transactions as Array<{
              id: string;
              amount: number;
              date: string;
              type: string;
              user_id: string;
              description: string | null;
              accounts: { id: string; name: string; is_shared: boolean };
            }>).map((t) => (
              <Link
                key={t.id}
                href={`/transactions/${t.id}`}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/50 transition-colors -mx-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {t.description || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.date} &middot; {t.accounts?.name || "Unknown account"}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium shrink-0 ml-3 ${
                    t.type === "income"
                      ? "text-green-600"
                      : t.type === "expense"
                        ? "text-red-600"
                        : ""
                  }`}
                >
                  {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}¥
                  {Math.abs(t.amount).toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
