import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getProfileById(
  supabase: Supabase,
  userId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  return data
}

export async function getPartnerProfile(
  supabase: Supabase,
  partnerUserId: string | null,
) {
  if (!partnerUserId) return null
  const { data } = await supabase
    .from("profiles")
    .select("name, email, avatar_url")
    .eq("id", partnerUserId)
    .single()
  return data
}

export async function getProfilesByIds(
  supabase: Supabase,
  userIds: string[],
) {
  if (userIds.length === 0) return []
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", userIds)
  return data || []
}
