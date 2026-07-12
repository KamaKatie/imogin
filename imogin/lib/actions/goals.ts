"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPartnershipId } from "@/lib/queries"

async function adjustBalance(supabase: Awaited<ReturnType<typeof createClient>>, accountId: string, delta: number) {
  const { data: account } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single()
  if (account) {
    await supabase
      .from("accounts")
      .update({ balance: account.balance + delta, updated_at: new Date().toISOString() })
      .eq("id", accountId)
  }
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
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const isShared = formData.get("is_shared") === "true"

  let partnershipId: string | null = null
  if (isShared) {
    partnershipId = await getPartnershipId(supabase, user.id)
    if (!partnershipId) throw new Error("No partnership found")
  }

  const { data: goal, error: goalError } = await supabase.from("goals").insert({
    user_id: isShared ? null : user.id,
    partnership_id: partnershipId,
    name,
    description: description || null,
    target_amount: targetAmount,
    target_date: targetDate || null,
    category_id: categoryId || null,
    icon: icon || null,
    color: color || null,
  }).select().single()

  if (goalError) throw new Error(goalError.message)

  const { data: account, error: accountError } = await supabase.from("accounts").insert({
    name,
    type: "savings",
    balance: 0,
    user_id: isShared ? null : user.id,
    partnership_id: partnershipId,
    is_shared: isShared,
    currency: "JPY",
    icon: icon || null,
    color: color || null,
  }).select().single()

  if (accountError) throw new Error(accountError.message)

  await supabase
    .from("goals")
    .update({ account_id: account.id })
    .eq("id", goal.id)

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

  const accountUpdates: Record<string, unknown> = {}
  if (name) accountUpdates.name = name
  if (icon) accountUpdates.icon = icon
  if (color) accountUpdates.color = color

  if (Object.keys(accountUpdates).length > 0) {
    const { data: goal } = await supabase
      .from("goals")
      .select("account_id")
      .eq("id", id)
      .single()
    if (goal?.account_id) {
      await supabase
        .from("accounts")
        .update(accountUpdates)
        .eq("id", goal.account_id)
    }
  }

  return { success: true }
}

export async function addGoalContribution(goalId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const amount = parseFloat(formData.get("amount") as string)
  const note = formData.get("note") as string
  const fromAccountId = formData.get("account_id") as string | null

  const { data: goal } = await supabase
    .from("goals")
    .select("account_id, target_amount")
    .eq("id", goalId)
    .single()

  if (!goal?.account_id) throw new Error("Goal has no linked account")

  if (!fromAccountId) throw new Error("Please select an account to transfer from")

  const partnershipId = await getPartnershipId(supabase, user.id)

  let transferCategoryId: string | null = null
  if (partnershipId) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("partnership_id", partnershipId)
      .eq("name", "Transfer")
      .eq("type", "transfer")
      .single()

    if (existing) {
      transferCategoryId = existing.id
    } else {
      const { data: newCat } = await supabase
        .from("categories")
        .insert({
          partnership_id: partnershipId,
          name: "Transfer",
          type: "transfer",
          color: "#6B7280",
        })
        .select("id")
        .single()
      transferCategoryId = newCat?.id || null
    }
  }

  const description = note || `Contribution to goal`

  const { error: txError } = await supabase.from("transactions").insert({
    account_id: fromAccountId,
    to_account_id: goal.account_id,
    user_id: user.id,
    amount,
    type: "transfer",
    category_id: transferCategoryId,
    description,
    date: new Date().toISOString().split("T")[0],
    is_split: false,
  })

  if (txError) throw new Error(txError.message)

  await adjustBalance(supabase, fromAccountId, -amount)
  await adjustBalance(supabase, goal.account_id, amount)

  const { data: goalAccount } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", goal.account_id)
    .single()

  if (goalAccount) {
    const newAmount = goalAccount.balance
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

  const { data: goal } = await supabase
    .from("goals")
    .select("account_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)

  if (goal?.account_id) {
    await supabase
      .from("accounts")
      .delete()
      .eq("id", goal.account_id)
  }

  return { success: true }
}
