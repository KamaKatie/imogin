"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { BudgetPeriod } from "@/lib/supabase/types-extension"

async function getPartnershipId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single()

  return data?.id || null
}

export async function getBudgets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

  const { data } = await supabase
    .from("budgets")
    .select("*, categories(*)")
    .or(
      partnershipId
        ? `user_id.eq.${user.id},partnership_id.eq.${partnershipId}`
        : `user_id.eq.${user.id}`
    )

  return data || []
}

export async function getBudgetWithSpending() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

  const budgets = await supabase
    .from("budgets")
    .select("*, categories(*)")
    .or(
      partnershipId
        ? `user_id.eq.${user.id},partnership_id.eq.${partnershipId}`
        : `user_id.eq.${user.id}`
    )

  if (!budgets.data) return []

  const now = new Date()
  const firstOfMonth = now.toISOString().split("T")[0].slice(0, 7) + "-01"
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const budgetsWithSpending = await Promise.all(
    budgets.data.map(async (budget) => {
      let spent = 0
      let baseQuery = supabase
        .from("transactions")
        .select("amount")
        .eq("category_id", budget.category_id)
        .eq("type", "expense")
        .gte("date", firstOfMonth)
        .lte("date", lastOfMonth)

      if (budget.user_id) {
        const { data: txns } = await baseQuery.eq("user_id", user.id)
        spent = txns?.reduce((s, t) => s + Math.abs(t.amount), 0) || 0
      } else {
        const { data: txns } = await baseQuery
        spent = txns?.reduce((s, t) => s + Math.abs(t.amount), 0) || 0
      }

      return { ...budget, spent }
    })
  )

  return budgetsWithSpending
}

export async function createBudget(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const categoryId = formData.get("category_id") as string
  const amount = parseFloat(formData.get("amount") as string)
  const period = formData.get("period") as BudgetPeriod
  const startDate = formData.get("start_date") as string
  const isShared = formData.get("is_shared") === "true"

  if (isShared) {
    const partnershipId = await getPartnershipId(supabase, user.id)
    if (!partnershipId) throw new Error("No partnership found")

    const { error } = await supabase.from("budgets").insert({
      partnership_id: partnershipId,
      category_id: categoryId,
      amount,
      period,
      start_date: startDate,
    })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from("budgets").insert({
      user_id: user.id,
      category_id: categoryId,
      amount,
      period,
      start_date: startDate,
    })
    if (error) throw new Error(error.message)
  }

  redirect("/budgets")
}

export async function deleteBudget(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  redirect("/budgets")
}
