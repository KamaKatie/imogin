"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { BillingCycle, SplitMethod } from "@/lib/supabase/types-extension"

async function getPartnershipId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single()

  return data?.id || null
}

export async function getSubscriptions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) return []

  const { data } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories(*),
      accounts(*),
      subscription_splits(*)
    `)
    .eq("partnership_id", partnershipId)
    .eq("active", true)

  return data || []
}

export async function createSubscription(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) throw new Error("No partnership found")

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const amount = parseFloat(formData.get("amount") as string)
  const billingCycle = formData.get("billing_cycle") as BillingCycle
  const nextBillingDate = formData.get("next_billing_date") as string
  const categoryId = formData.get("category_id") as string
  const paymentAccountId = formData.get("payment_account_id") as string
  const splitMethod = formData.get("split_method") as SplitMethod
  const splitPayerUserId = formData.get("split_payer_user_id") as string

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .insert({
      partnership_id: partnershipId,
      name,
      description: description || null,
      amount,
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate,
      category_id: categoryId || null,
      payment_account_id: paymentAccountId || null,
      split_method: splitMethod,
      split_payer_user_id: splitPayerUserId || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (splitMethod === "custom" && sub) {
    const partnerUserId = formData.get("partner_user_id") as string
    const yourPercent = parseFloat(formData.get("your_percent") as string) || 50
    const partnerPercent = 100 - yourPercent

    await supabase.from("subscription_splits").insert([
      { subscription_id: sub.id, user_id: user.id, percentage: yourPercent },
      { subscription_id: sub.id, user_id: partnerUserId, percentage: partnerPercent },
    ])
  }

  redirect("/subscriptions")
}

export async function toggleSubscription(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("subscriptions")
    .update({ active })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  redirect("/subscriptions")
}
