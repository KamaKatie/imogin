"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { BillingCycle, SplitMethod } from "@/lib/supabase/types-extension"
import { getPartnershipId } from "@/lib/queries"
import { getActiveBills, getBillById } from "@/lib/queries/bills"

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function clampDay(day: number, year: number, month: number) {
  return Math.min(day, daysInMonth(year, month))
}

function calculateNextBillingDate(dueDay: number, billingCycle: BillingCycle): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  switch (billingCycle) {
    case "weekly": {
      const clamped = clampDay(dueDay, year, month)
      let candidate = new Date(year, month - 1, clamped)
      if (candidate <= now) {
        candidate = new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
      return candidate.toISOString().split("T")[0]
    }
    case "monthly": {
      const clamped = clampDay(dueDay, year, month)
      let candidate = new Date(year, month - 1, clamped)
      if (candidate <= now) {
        const nextMonth = month === 12 ? 1 : month + 1
        const nextYear = month === 12 ? year + 1 : year
        candidate = new Date(nextYear, nextMonth - 1, clampDay(dueDay, nextYear, nextMonth))
      }
      return candidate.toISOString().split("T")[0]
    }
    case "quarterly": {
      const clamped = clampDay(dueDay, year, month)
      let candidate = new Date(year, month - 1, clamped)
      while (candidate <= now) {
        const m = candidate.getMonth() + 1 + 3
        const y = candidate.getFullYear() + (m > 12 ? 1 : 0)
        const monthIdx = m > 12 ? m - 13 : m - 1
        candidate = new Date(y, monthIdx, clampDay(dueDay, y, monthIdx + 1))
      }
      return candidate.toISOString().split("T")[0]
    }
    case "yearly": {
      const clamped = clampDay(dueDay, year, month)
      let candidate = new Date(year, month - 1, clamped)
      if (candidate <= now) {
        candidate = new Date(year + 1, month - 1, clampDay(dueDay, year + 1, month))
      }
      return candidate.toISOString().split("T")[0]
    }
  }
}

export async function getBills() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) return []

  return await getActiveBills(supabase, partnershipId)
}

export async function getBill(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return await getBillById(supabase, id)
}

export async function getBillWithDetails(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const bill = await getBillById(supabase, id)

  if (!bill) return null

  const partnershipId = bill.partnership_id

  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      *,
      profiles!inner(name)
    `)
    .eq("bill_id", id)
    .order("date", { ascending: false })

  const { data: memberRows } = await supabase
    .from("partnership_members")
    .select("user_id")
    .eq("partnership_id", partnershipId)

  let partnerProfile: { name: string | null } | null = null
  const otherUserId = memberRows?.find((m) => m.user_id !== user.id)?.user_id
  if (otherUserId) {
    const { data: pp } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", otherUserId)
      .single()
    partnerProfile = pp
  }

  const partnership = await supabase
    .from("partnerships")
    .select("id")
    .eq("id", partnershipId)
    .single()
    .then((r) => r.data)

  return { bill, transactions: transactions || [], partnership, partnerProfile }
}

export async function createBill(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) throw new Error("No partnership found")

  const name = formData.get("name") as string
  const amount = parseFloat(formData.get("amount") as string)
  const billingCycle = formData.get("billing_cycle") as BillingCycle
  const dueDayStr = formData.get("due_day") as string
  const dueDay = dueDayStr ? parseInt(dueDayStr, 10) : null
  const nextBillingDate = dueDay ? calculateNextBillingDate(dueDay, billingCycle) : (formData.get("next_billing_date") as string)
  const categoryId = formData.get("category_id") as string
  const paymentAccountId = formData.get("payment_account_id") as string
  const splitMethod = formData.get("split_method") as SplitMethod
  const splitPayerUserId = formData.get("split_payer_user_id") as string
  const iconUrl = formData.get("icon_url") as string
  const url = formData.get("url") as string

  const { data: bill, error } = await supabase
    .from("bills")
    .insert({
      partnership_id: partnershipId,
      name,
      amount,
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate,
      due_day: dueDay,
      category_id: categoryId || null,
      payment_account_id: paymentAccountId || null,
      split_method: splitMethod,
      split_payer_user_id: splitPayerUserId || null,
      icon_url: iconUrl || null,
      url: url || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (splitMethod === "custom" && bill) {
    const partnerUserId = formData.get("partner_user_id") as string
    const yourPercent = parseFloat(formData.get("your_percent") as string) || 50
    const partnerPercent = 100 - yourPercent

    await supabase.from("bill_splits").insert([
      { bill_id: bill.id, user_id: user.id, percentage: yourPercent },
      { bill_id: bill.id, user_id: partnerUserId, percentage: partnerPercent },
    ])
  }

  return { success: true, id: bill?.id }
}

export async function updateBill(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const name = formData.get("name") as string
  const amount = parseFloat(formData.get("amount") as string)
  const billingCycle = formData.get("billing_cycle") as BillingCycle
  const dueDayStr = formData.get("due_day") as string
  const dueDay = dueDayStr ? parseInt(dueDayStr, 10) : null
  const nextBillingDate = dueDay ? calculateNextBillingDate(dueDay, billingCycle) : (formData.get("next_billing_date") as string)
  const categoryId = formData.get("category_id") as string
  const paymentAccountId = formData.get("payment_account_id") as string
  const splitMethod = formData.get("split_method") as SplitMethod
  const splitPayerUserId = formData.get("split_payer_user_id") as string
  const url = formData.get("url") as string

  const updates: Record<string, unknown> = {
    name,
    amount,
    billing_cycle: billingCycle,
    next_billing_date: nextBillingDate,
    due_day: dueDay,
    category_id: categoryId || null,
    payment_account_id: paymentAccountId || null,
    split_method: splitMethod,
    split_payer_user_id: splitPayerUserId || null,
    url: url || null,
  }

  if (formData.has("icon_url")) {
    updates.icon_url = (formData.get("icon_url") as string) || null
  }

  const { error } = await supabase
    .from("bills")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)

  if (splitMethod === "custom") {
    await supabase.from("bill_splits").delete().eq("bill_id", id)
    const partnerUserId = formData.get("partner_user_id") as string
    const yourPercent = parseFloat(formData.get("your_percent") as string) || 50
    const partnerPercent = 100 - yourPercent
    await supabase.from("bill_splits").insert([
      { bill_id: id, user_id: user.id, percentage: yourPercent },
      { bill_id: id, user_id: partnerUserId, percentage: partnerPercent },
    ])
  } else {
    await supabase.from("bill_splits").delete().eq("bill_id", id)
  }

  return { success: true }
}

export async function toggleBill(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("bills")
    .update({ active })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function deleteBill(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  return { success: true }
}
