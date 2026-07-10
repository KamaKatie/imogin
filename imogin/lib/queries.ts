import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getPartnershipId(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", userId)
    .maybeSingle()
  return data?.partnership_id || null
}

export async function getPartnerUserId(supabase: SupabaseClient<Database>, partnershipId: string, userId: string) {
  const { data: members } = await supabase
    .from("partnership_members")
    .select("user_id")
    .eq("partnership_id", partnershipId)
  return members?.find(m => m.user_id !== userId)?.user_id || null
}

export async function getAccessibleAccountIds(supabase: SupabaseClient<Database>, userId: string, partnershipId: string | null) {
  const personal = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("is_shared", false)

  const personalIds = personal.data?.map(a => a.id) || []

  let sharedIds: string[] = []
  if (partnershipId) {
    const shared = await supabase
      .from("accounts")
      .select("id")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)
    sharedIds = shared.data?.map(a => a.id) || []
  }

  return [...new Set([...sharedIds, ...personalIds])]
}
