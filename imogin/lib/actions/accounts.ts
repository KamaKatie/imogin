"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { AccountType } from "@/lib/supabase/types-extension"
import { getPartnershipId } from "@/lib/queries"

export async function getAccounts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

  if (partnershipId) {
    const { data: shared } = await supabase
      .from("accounts")
      .select("*")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)

    const { data: personal } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)

    return [...(personal || []), ...(shared || [])]
  }

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)

  return data || []
}

export async function getAccount(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single()

  return data
}

export async function createAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const name = formData.get("name") as string
  const type = formData.get("type") as AccountType
  const balance = parseFloat(formData.get("balance") as string) || 0
  const color = formData.get("color") as string
  const icon = formData.get("icon") as string
  const isShared = formData.get("is_shared") === "true"

  if (isShared) {
    const partnershipId = await getPartnershipId(supabase, user.id)
    if (!partnershipId) throw new Error("No partnership found")

    const { error } = await supabase.from("accounts").insert({
      partnership_id: partnershipId,
      name, type, balance, currency: "JPY",
      is_shared: true, color, icon,
    })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name, type, balance, currency: "JPY",
      is_shared: false, color, icon,
    })
    if (error) throw new Error(error.message)
  }

  return { success: true }
}

export async function updateAccount(id: string, formData: FormData) {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  const name = formData.get("name")
  const type = formData.get("type")
  const color = formData.get("color")
  const icon = formData.get("icon")

  if (name) updates.name = name
  if (type) updates.type = type
  if (color) updates.color = color
  if (icon) updates.icon = icon

  const { error } = await supabase
    .from("accounts")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  return { success: true }
}

