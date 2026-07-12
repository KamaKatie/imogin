"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { TransactionType } from "@/lib/supabase/types-extension"

async function adjustBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  delta: number,
) {
  const { data: account } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single()
  if (!account) throw new Error("Account not found")
  const { error } = await supabase
    .from("accounts")
    .update({ balance: (account.balance || 0) + delta })
    .eq("id", accountId)
  if (error) throw new Error(error.message)
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
  const notes = formData.get("notes") as string
  const toAccountId = formData.get("to_account_id") as string
  const forSelection = formData.get("for_selection") as string | null
  const partnerUserId = formData.get("partner_user_id") as string | null

  const isSplit = forSelection === "both" || forSelection === "partner"

  const insertData: Record<string, unknown> = {
    account_id: accountId,
    user_id: user.id,
    amount,
    description: description || null,
    category_id: categoryId || null,
    date,
    type,
    is_split: isSplit,
    split_method: isSplit ? "equal" : null,
    notes: notes || null,
  }
  if (type === "transfer" && toAccountId) {
    insertData.to_account_id = toAccountId
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert(insertData)
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (type === "expense") {
    await adjustBalance(supabase, accountId, -amount)
  } else if (type === "income") {
    await adjustBalance(supabase, accountId, amount)
  } else if (type === "transfer" && toAccountId) {
    await adjustBalance(supabase, accountId, -amount)
    await adjustBalance(supabase, toAccountId, amount)
  }

  if (forSelection === "both" && partnerUserId && transaction) {
    const half = amount / 2
    await supabase.from("transaction_splits").insert([
      { transaction_id: transaction.id, user_id: user.id, amount: half, percentage: 50 },
      { transaction_id: transaction.id, user_id: partnerUserId, amount: half, percentage: 50 },
    ])
  } else if (forSelection === "partner" && partnerUserId && transaction) {
    await supabase.from("transaction_splits").insert([
      { transaction_id: transaction.id, user_id: user.id, amount: 0, percentage: 0 },
      { transaction_id: transaction.id, user_id: partnerUserId, amount, percentage: 100 },
    ])
  }

  return { success: true }
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: old } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single()
  if (!old) throw new Error("Transaction not found")

  const amountStr = formData.get("amount") as string
  const newAmount = parseFloat(amountStr)
  const newAccountId = formData.get("account_id") as string
  const accountChanged = newAccountId && newAccountId !== old.account_id

  if (accountChanged) {
    if (old.type === "expense") {
      await adjustBalance(supabase, old.account_id, old.amount)
      await adjustBalance(supabase, newAccountId, -newAmount)
    } else if (old.type === "income") {
      await adjustBalance(supabase, old.account_id, -old.amount)
      await adjustBalance(supabase, newAccountId, newAmount)
    } else if (old.type === "transfer") {
      await adjustBalance(supabase, old.account_id, old.amount)
      await adjustBalance(supabase, newAccountId, -newAmount)
      if (old.to_account_id) {
        await adjustBalance(supabase, old.to_account_id, newAmount - old.amount)
      }
    }
  } else {
    const amountDiff = newAmount - old.amount
    if (old.type === "expense") {
      await adjustBalance(supabase, old.account_id, -amountDiff)
    } else if (old.type === "income") {
      await adjustBalance(supabase, old.account_id, amountDiff)
    } else if (old.type === "transfer") {
      await adjustBalance(supabase, old.account_id, -amountDiff)
      if (old.to_account_id) {
        await adjustBalance(supabase, old.to_account_id, amountDiff)
      }
    }
  }

  const updates: Record<string, unknown> = {}
  const description = formData.get("description") as string
  const categoryId = formData.get("category_id") as string
  const date = formData.get("date") as string
  const forSelection = formData.get("for_selection") as string | null
  const partnerUserId = formData.get("partner_user_id") as string | null
  const newIsSplit = forSelection === "both" || forSelection === "partner"

  if (description) updates.description = description
  if (amountStr) updates.amount = newAmount
  if (categoryId) updates.category_id = categoryId
  if (date) updates.date = date
  if (newAccountId) updates.account_id = newAccountId
  if (forSelection) {
    updates.is_split = newIsSplit
    updates.split_method = newIsSplit ? "equal" : null
  }

  const { error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  // Handle forSelection changes
  if (newIsSplit && partnerUserId) {
    const { data: existingSplits } = await supabase
      .from("transaction_splits")
      .select("percentage")
      .eq("transaction_id", id)

    const hasSplits = existingSplits && existingSplits.length > 0
    const maxPct = hasSplits ? Math.max(...existingSplits.map(s => s.percentage)) : 0
    const wasBoth = maxPct === 50
    const wasPartner = maxPct === 100
    const needsRecreate = !hasSplits || (forSelection === "both" && wasPartner) || (forSelection === "partner" && wasBoth)

    if (needsRecreate) {
      if (hasSplits) {
        await supabase.from("transaction_splits").delete().eq("transaction_id", id)
      }
      if (forSelection === "both") {
        const half = newAmount / 2
        await supabase.from("transaction_splits").insert([
          { transaction_id: id, user_id: user.id, amount: half, percentage: 50 },
          { transaction_id: id, user_id: partnerUserId, amount: half, percentage: 50 },
        ])
      } else {
        await supabase.from("transaction_splits").insert([
          { transaction_id: id, user_id: user.id, amount: 0, percentage: 0 },
          { transaction_id: id, user_id: partnerUserId, amount: newAmount, percentage: 100 },
        ])
      }
    }
  } else if ((forSelection === "me" || !forSelection) && old.is_split) {
    await supabase.from("transaction_splits").delete().eq("transaction_id", id)
  }

  // Update split amounts from form fields (for unchanged split state)
  const splitIds = formData.getAll("split_id")
  const splitAmounts = formData.getAll("split_amount")
  if (splitIds.length > 0 && splitIds.length === splitAmounts.length) {
    for (let i = 0; i < splitIds.length; i++) {
      const splitAmt = parseFloat(splitAmounts[i] as string)
      if (!isNaN(splitAmt)) {
        const { error: splitErr } = await supabase
          .from("transaction_splits")
          .update({ amount: splitAmt })
          .eq("id", splitIds[i] as string)
        if (splitErr) throw new Error(splitErr.message)
      }
    }
  }

  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()

  const { data: tx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single()
  if (!tx) throw new Error("Transaction not found")

  if (tx.type === "expense") {
    await adjustBalance(supabase, tx.account_id, tx.amount)
  } else if (tx.type === "income") {
    await adjustBalance(supabase, tx.account_id, -tx.amount)
  } else if (tx.type === "transfer") {
    await adjustBalance(supabase, tx.account_id, tx.amount)
    if (tx.to_account_id) {
      await adjustBalance(supabase, tx.to_account_id, -tx.amount)
    }
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)

  // Sync goal current_amount if this was a transfer to a goal account
  if (tx.type === "transfer" && tx.to_account_id) {
    const { data: goal } = await supabase
      .from("goals")
      .select("id")
      .eq("account_id", tx.to_account_id)
      .single()
    if (goal) {
      const { data: account } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", tx.to_account_id)
        .single()
      if (account) {
        await supabase
          .from("goals")
          .update({ current_amount: account.balance || 0 })
          .eq("id", goal.id)
      }
    }
  }

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
