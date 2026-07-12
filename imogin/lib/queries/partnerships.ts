import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getPartnershipDetails(
  supabase: Supabase,
  partnershipId: string,
) {
  const { data } = await supabase
    .from("partnerships")
    .select("id, name, share_code, share_code_expires_at")
    .eq("id", partnershipId)
    .single()
  return data
}

export async function getPartnershipMembers(
  supabase: Supabase,
  partnershipId: string,
) {
  const { data } = await supabase
    .from("partnership_members")
    .select("user_id")
    .eq("partnership_id", partnershipId)
  return data || []
}
