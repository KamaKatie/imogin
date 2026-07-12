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
