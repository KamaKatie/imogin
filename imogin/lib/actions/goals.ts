"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPartnershipId } from "@/lib/queries"
import { getPartnershipGoals, getGoalById } from "@/lib/queries/goals"

export async function getGoals() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

  return await getPartnershipGoals(supabase, user.id, partnershipId)
}

export async function getGoal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return await getGoalById(supabase, id)
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const targetAmount = parseFloat(formData.get("target_amount") as string)
  const targetDate = formData.get("target_date") as string
  const categoryId = formData.get("category_id") as string
  const accountId = formData.get("account_id") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const isShared = formData.get("is_shared") === "true"

  if (isShared) {
    const partnershipId = await getPartnershipId(supabase, user.id)
    if (!partnershipId) throw new Error("No partnership found")

    const { error } = await supabase.from("goals").insert({
      partnership_id: partnershipId,
      name,
      description: description || null,
      target_amount: targetAmount,
      target_date: targetDate || null,
      category_id: categoryId || null,
      account_id: accountId || null,
      icon: icon || null,
      color: color || null,
    })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      name,
      description: description || null,
      target_amount: targetAmount,
      target_date: targetDate || null,
      category_id: categoryId || null,
      account_id: accountId || null,
      icon: icon || null,
      color: color || null,
    })
    if (error) throw new Error(error.message)
  }

  return { success: true }
}

export async function updateGoal(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const updates: Record<string, unknown> = {}
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const targetAmount = formData.get("target_amount") as string
  const targetDate = formData.get("target_date") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string

  if (name) updates.name = name
  if (description !== null) updates.description = description || null
  if (targetAmount) updates.target_amount = parseFloat(targetAmount)
  if (targetDate !== null) updates.target_date = targetDate || null
  if (icon) updates.icon = icon
  if (color) updates.color = color

  const { error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function addGoalContribution(goalId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const amount = parseFloat(formData.get("amount") as string)
  const note = formData.get("note") as string

  const { error: contribError } = await supabase.from("goal_contributions").insert({
    goal_id: goalId,
    user_id: user.id,
    amount,
    note: note || null,
  })

  if (contribError) throw new Error(contribError.message)

  const { data: goal } = await supabase
    .from("goals")
    .select("current_amount, target_amount")
    .eq("id", goalId)
    .single()

  if (goal) {
    const newAmount = (goal.current_amount || 0) + amount
    const status = newAmount >= goal.target_amount ? "completed" : "active"

    await supabase
      .from("goals")
      .update({ current_amount: newAmount, status })
      .eq("id", goalId)
  }
}

export async function deleteGoal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  return { success: true }
}

