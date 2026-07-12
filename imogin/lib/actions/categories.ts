"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { CategoryType } from "@/lib/supabase/types-extension"
import { getPartnershipId } from "@/lib/queries"
import { getPartnershipCategories } from "@/lib/queries/categories"

export async function getCategories() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) return []

  return await getPartnershipCategories(supabase, partnershipId) || []
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) throw new Error("No partnership found")

  const name = formData.get("name") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const type = formData.get("type") as CategoryType

  const { error } = await supabase.from("categories").insert({
    partnership_id: partnershipId,
    name, icon, color, type,
  })

  if (error) throw new Error(error.message)
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const type = formData.get("type") as CategoryType

  const { error } = await supabase
    .from("categories")
    .update({ name, icon, color, type })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
}
