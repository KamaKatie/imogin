"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function getMonthlySpending(year: number, month: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0]
  const lastDay = new Date(year, month, 0).toISOString().split("T")[0]

  const sharedAccountIds = partnership?.id
    ? (await supabase
        .from("accounts")
        .select("id")
        .eq("partnership_id", partnership.id)
        .eq("is_shared", true)).data?.map(a => a.id) || []
    : []

  const personalAccountIds = (await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_shared", false)).data?.map(a => a.id) || []

  const allIds = [...new Set([...sharedAccountIds, ...personalAccountIds])]
  if (allIds.length === 0) return { byCategory: [], totalSpent: 0, totalIncome: 0, byPerson: [] }

  const { data: txns } = await supabase
    .from("transactions")
    .select(`
      *,
      categories(*),
      transaction_splits(*)
    `)
    .in("account_id", allIds)
    .gte("date", firstDay)
    .lte("date", lastDay)

  if (!txns) return { byCategory: [], totalSpent: 0, totalIncome: 0, byPerson: [] }

  const expenses = txns.filter(t => t.type === "expense")
  const incomes = txns.filter(t => t.type === "income")

  const categoryMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()
  for (const t of expenses) {
    const key = t.category_id || "uncategorized"
    const cat = t.categories as { name: string; color: string | null; icon: string | null } | null
    const existing = categoryMap.get(key) || { name: cat?.name || "Uncategorized", color: cat?.color || null, icon: cat?.icon || null, total: 0 }
    existing.total += Math.abs(t.amount)
    categoryMap.set(key, existing)
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([id, data]) => ({ category_id: id, ...data }))
    .sort((a, b) => b.total - a.total)

  const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalIncome = incomes.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const personMap = new Map<string, number>()
  if (partnership) {
    for (const t of txns) {
      if (t.transaction_splits && t.transaction_splits.length > 0) {
        for (const split of t.transaction_splits as Array<{ user_id: string; amount: number }>) {
          personMap.set(split.user_id, (personMap.get(split.user_id) || 0) + Math.abs(split.amount))
        }
      } else {
        personMap.set(t.user_id, (personMap.get(t.user_id) || 0) + Math.abs(t.amount))
      }
    }
  }

  const byPerson = Array.from(personMap.entries()).map(([userId, total]) => ({ userId, total }))

  return { byCategory, totalSpent, totalIncome, byPerson }
}

export async function getYearlySummary(year: number) {
  const months = []
  for (let m = 1; m <= 12; m++) {
    const data = await getMonthlySpending(year, m)
    months.push({ month: m, totalSpent: data.totalSpent, totalIncome: data.totalIncome })
  }
  return months
}
