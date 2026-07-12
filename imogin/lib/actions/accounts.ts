"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { AccountType } from "@/lib/supabase/types-extension"
import { getPartnershipId } from "@/lib/queries"

const STORAGE_BASE = "https://jjojwvdtwtodapqszizc.supabase.co/storage/v1/object/public/account_icons/"

export async function uploadAccountIcon(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const file = formData.get("file") as File
  if (!file) throw new Error("No file provided")
  if (!file.type.startsWith("image/")) throw new Error("File must be an image")
  if (file.size > 2 * 1024 * 1024) throw new Error("File must be less than 2MB")

  const ext = file.name.split(".").pop() || "png"
  const fileName = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("account_icons")
    .upload(fileName, file, { contentType: file.type })

  if (error) throw new Error(error.message)

  return STORAGE_BASE + fileName
}

export async function deleteAccountIcon(iconUrl: string) {
  const path = iconUrl.replace(STORAGE_BASE, "")
  if (!path) return { success: true }
  const supabase = await createClient()
  await supabase.storage.from("account_icons").remove([path])
  return { success: true }
}

export async function createAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const name = formData.get("name") as string
  const type = formData.get("type") as AccountType
  const balance = parseFloat(formData.get("balance") as string) || 0
  const icon = formData.get("icon") as string
  const isShared = formData.get("is_shared") === "true"

  const insertData: Record<string, unknown> = {
    name, type, balance, currency: "JPY",
    is_shared: isShared,
  }
  if (icon) insertData.icon = icon

  if (isShared) {
    const partnershipId = await getPartnershipId(supabase, user.id)
    if (!partnershipId) throw new Error("No partnership found")

    insertData.partnership_id = partnershipId
    const { error } = await supabase.from("accounts").insert(insertData)
    if (error) throw new Error(error.message)
  } else {
    insertData.user_id = user.id
    const { error } = await supabase.from("accounts").insert(insertData)
    if (error) throw new Error(error.message)
  }

  return { success: true }
}

export async function updateAccount(id: string, formData: FormData) {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  const name = formData.get("name")
  const type = formData.get("type")
  const balance = formData.get("balance")
  const icon = formData.get("icon")

  if (name) updates.name = name
  if (type) updates.type = type
  if (balance) updates.balance = parseFloat(balance as string)
  if (icon) updates.icon = icon

  const { error } = await supabase
    .from("accounts")
    .update(updates)
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()

  const { data: goal } = await supabase
    .from("goals")
    .select("id")
    .eq("account_id", id)
    .maybeSingle()

  if (goal) {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", id)
      .single()

    if (account && account.balance !== 0) {
      throw new Error("Cannot delete a goal account with a balance. Withdraw funds first.")
    }

    await supabase.from("goals").delete().eq("id", goal.id)
  }

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
  return { success: true }
}

