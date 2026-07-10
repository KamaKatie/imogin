"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import crypto from "crypto"

export async function getPartnership() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) return null

  const partnershipId = membership.partnership_id

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .eq("id", partnershipId)
    .single()

  if (!partnership) return null

  const { data: memberRows } = await supabase
    .from("partnership_members")
    .select("user_id, joined_at")
    .eq("partnership_id", partnershipId)

  const userIds = memberRows?.map((m) => m.user_id) || []
  let profiles: Array<{ id: string; name: string | null; email: string }> = []
  if (userIds.length > 0) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds)
    profiles = p || []
  }

  return { partnership, members: profiles }
}

export async function createPartnership() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: existing } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) throw new Error("Already in a partnership")

  const code = crypto.randomBytes(3).toString("hex").toUpperCase()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const partnershipId = crypto.randomUUID()

  const { error } = await supabase
    .from("partnerships")
    .insert({ id: partnershipId, share_code: code, share_code_expires_at: expiresAt })

  if (error) throw new Error(error.message)

  const { error: memberError } = await supabase
    .from("partnership_members")
    .insert({ partnership_id: partnershipId, user_id: user.id })

  if (memberError) throw new Error(memberError.message)

  return code
}

export async function joinPartnership(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: existing } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) throw new Error("Already in a partnership")

  const code = formData.get("code") as string

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .eq("share_code", code)
    .single()

  if (!partnership) throw new Error("Invalid share code")
  if (partnership.share_code_expires_at && new Date(partnership.share_code_expires_at) < new Date()) {
    throw new Error("Share code has expired")
  }

  const { error: memberError } = await supabase
    .from("partnership_members")
    .insert({ partnership_id: partnership.id, user_id: user.id })

  if (memberError) throw new Error(memberError.message)

  return { success: true }
}

export async function leavePartnership() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: membership } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) return

  const partnershipId = membership.partnership_id

  await supabase
    .from("partnership_members")
    .delete()
    .eq("user_id", user.id)

  const { count } = await supabase
    .from("partnership_members")
    .select("*", { count: "exact", head: true })
    .eq("partnership_id", partnershipId)

  if (count === 0) {
    await supabase.from("categories").delete().eq("partnership_id", partnershipId)
    await supabase.from("bills").delete().eq("partnership_id", partnershipId)
    await supabase.from("partnerships").delete().eq("id", partnershipId)
  }

  return { success: true }
}

export async function updatePartnershipName(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: membership } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) throw new Error("No partnership found")

  const name = formData.get("name") as string

  const { error } = await supabase
    .from("partnerships")
    .update({ name })
    .eq("id", membership.partnership_id)

  if (error) throw new Error(error.message)
}

export async function regenerateShareCode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: membership } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership) throw new Error("No partnership found")

  const code = crypto.randomBytes(3).toString("hex").toUpperCase()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from("partnerships")
    .update({ share_code: code, share_code_expires_at: expiresAt })
    .eq("id", membership.partnership_id)

  if (error) throw new Error(error.message)

  return code
}
