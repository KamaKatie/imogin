"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { CategoryType } from "@/lib/supabase/types-extension"

async function getPartnershipId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single()

  return data?.id || null
}

export async function getCategories() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)
  if (!partnershipId) return []

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("partnership_id", partnershipId)

  return data || []
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

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
}
