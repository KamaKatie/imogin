"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { BudgetPeriod } from "@/lib/supabase/types-extension"
import { getPartnershipId } from "@/lib/queries"

export async function updateBudget(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const updates: Record<string, unknown> = {}
  const categoryId = formData.get("category_id") as string
  const amount = formData.get("amount") as string
  const period = formData.get("period") as string
  const startDate = formData.get("start_date") as string
  const endDate = formData.get("end_date") as string

  if (categoryId) updates.category_id = categoryId
  if (amount) updates.amount = parseFloat(amount)
  if (period) updates.period = period
  if (startDate) updates.start_date = startDate
  if (endDate !== null) updates.end_date = endDate || null

  const { error } = await supabase
    .from("budgets")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)
  return { success: true }
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

  return { success: true }
}

export async function deleteBudget(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  return { success: true }
}

