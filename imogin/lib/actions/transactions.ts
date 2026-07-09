"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { SplitMethod, TransactionType } from "@/lib/supabase/types-extension"

export async function getTransactions(accountId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  let query

  if (partnership?.id) {
    query = supabase
      .from("transactions")
      .select(`
        *,
        accounts!inner(*),
        categories(*),
        transaction_splits(*)
      `)
      .or(
        `user_id.eq.${user.id},and(account_id.in.(
          select id from accounts where partnership_id.eq.${partnership.id}
        ))`
      )
  } else {
    query = supabase
      .from("transactions")
      .select(`
        *,
        accounts!inner(*),
        categories(*),
        transaction_splits(*)
      `)
      .eq("user_id", user.id)
  }

  if (accountId) {
    query = query.eq("account_id", accountId)
  }

  const { data } = await query.order("date", { ascending: false }).limit(100)
  return data || []
}

export async function getTransaction(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("transactions")
    .select(`
      *,
      accounts(*),
      categories(*),
      transaction_splits(*)
    `)
    .eq("id", id)
    .single()

  return data
}

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const accountId = formData.get("account_id") as string
  const amount = parseFloat(formData.get("amount") as string)
  const description = formData.get("description") as string
  const categoryId = formData.get("category_id") as string
  const date = formData.get("date") as string
  const type = formData.get("type") as TransactionType
  const splitMethod = formData.get("split_method") as SplitMethod | null
  const notes = formData.get("notes") as string

  const isSplit = splitMethod !== null

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      account_id: accountId,
      user_id: user.id,
      amount,
      description: description || null,
      category_id: categoryId || null,
      date,
      type,
      is_split: isSplit,
      split_method: splitMethod,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (isSplit && transaction) {
    const partnerUserId = formData.get("partner_user_id") as string

    if (splitMethod === "equal") {
      const half = amount / 2
      await supabase.from("transaction_splits").insert([
        { transaction_id: transaction.id, user_id: user.id, amount: half, percentage: 50 },
        { transaction_id: transaction.id, user_id: partnerUserId, amount: half, percentage: 50 },
      ])
    } else if (splitMethod === "covered") {
      const payerUserId = formData.get("payer_user_id") as string
      const otherUserId = payerUserId === user.id ? partnerUserId : user.id
      await supabase.from("transaction_splits").insert([
        { transaction_id: transaction.id, user_id: payerUserId, amount, percentage: 100 },
        { transaction_id: transaction.id, user_id: otherUserId, amount: 0, percentage: 0 },
      ])
    } else if (splitMethod === "custom") {
      const yourPercent = parseFloat(formData.get("your_percent") as string) || 50
      const partnerPercent = 100 - yourPercent
      const yourAmount = (amount * yourPercent) / 100
      const partnerAmount = amount - yourAmount
      await supabase.from("transaction_splits").insert([
        { transaction_id: transaction.id, user_id: user.id, amount: yourAmount, percentage: yourPercent },
        { transaction_id: transaction.id, user_id: partnerUserId, amount: partnerAmount, percentage: partnerPercent },
      ])
    }
  }

  return { success: true }
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const updates: Record<string, unknown> = {}
  const description = formData.get("description") as string
  const amount = formData.get("amount") as string
  const categoryId = formData.get("category_id") as string
  const date = formData.get("date") as string
  const notes = formData.get("notes") as string

  if (description) updates.description = description
  if (amount) updates.amount = parseFloat(amount)
  if (categoryId) updates.category_id = categoryId
  if (date) updates.date = date
  if (notes !== null) updates.notes = notes || null

  const { error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function settleSplit(splitId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("transaction_splits")
    .update({ settled: true, settled_at: new Date().toISOString() })
    .eq("id", splitId)

  if (error) throw new Error(error.message)
}

