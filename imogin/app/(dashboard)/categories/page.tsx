import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CategoriesManager } from "@/components/categories-manager"
import { getAppContext } from "@/lib/app-context"
import { getPartnershipCategories } from "@/lib/queries/categories"
import { getAccessibleAccountIds } from "@/lib/queries/accounts"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId, partnershipId } = ctx

  if (!partnershipId) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Create a partnership to manage categories.</p>
      </div>
    )
  }

  const [categories, allAccountIds] = await Promise.all([
    getPartnershipCategories(supabase, partnershipId),
    getAccessibleAccountIds(supabase, userId, partnershipId),
  ])

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  let spendingByCategory: { name: string; color: string | null; icon: string | null; total: number }[] = []

  if (allAccountIds.length > 0) {
    const { data: monthTxns } = await supabase
      .from("transactions")
      .select("amount, type, category_id, categories(name, color, icon)")
      .in("account_id", allAccountIds)
      .gte("date", firstDay)
      .lte("date", lastDay)

    if (monthTxns) {
      const catMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()
      for (const t of monthTxns.filter(t => t.type === "expense")) {
        const catArr = t.categories as unknown as { name: string; color: string | null; icon: string | null }[] | null
        const cat = Array.isArray(catArr) ? catArr[0] ?? null : catArr
        const key = t.category_id || "uncategorized"
        const existing = catMap.get(key) || { name: cat?.name || "Uncategorized", color: cat?.color || null, icon: cat?.icon || null, total: 0 }
        existing.total += Math.abs(t.amount)
        catMap.set(key, existing)
      }
      spendingByCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total)
    }
  }

  return (
    <div className="space-y-6">
      <CategoriesManager categories={categories || []} spendingByCategory={spendingByCategory} />
    </div>
  )
}
