"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import crypto from "crypto"

export async function getPartnership() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  if (!partnership) return null

  const partnerId = partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id

  let partner: { name: string | null; email: string } | null = null
  if (partnerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", partnerId)
      .single()
    partner = profile
  }

  return { partnership, partner }
}

export async function createPartnership() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: existing } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  if (existing) throw new Error("Already in a partnership")

  const code = crypto.randomBytes(3).toString("hex").toUpperCase()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const partnershipId = crypto.randomUUID()

  const { error } = await supabase
    .from("partnerships")
    .insert({ id: partnershipId, user1_id: user.id, share_code: code, share_code_expires_at: expiresAt })

  if (error) throw new Error(error.message)

  await supabase.rpc("seed_default_categories", { target_partnership_id: partnershipId })

  return code
}

export async function joinPartnership(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: existing } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

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
  if (partnership.user2_id) throw new Error("Partnership is full")

  await supabase
    .from("partnerships")
    .update({ user2_id: user.id, share_code: null, share_code_expires_at: null })
    .eq("id", partnership.id)

  redirect("/")
}

export async function leavePartnership() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  if (!partnership) return

  if (partnership.user1_id === user.id && partnership.user2_id) {
    await supabase
      .from("partnerships")
      .update({ user1_id: partnership.user2_id, user2_id: null })
      .eq("id", partnership.id)
  } else if (partnership.user1_id === user.id) {
    await supabase.from("partnerships").delete().eq("id", partnership.id)
  } else {
    await supabase
      .from("partnerships")
      .update({ user2_id: null })
      .eq("id", partnership.id)
  }

  redirect("/")
}
