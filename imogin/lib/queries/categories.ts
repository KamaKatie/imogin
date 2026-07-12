import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getPartnershipCategories(
  supabase: Supabase,
  partnershipId: string | null,
  opts?: {
    type?: "income" | "expense"
  },
) {
  if (!partnershipId) return []
  let query = supabase
    .from("categories")
    .select("id, name, type, icon, color")
    .eq("partnership_id", partnershipId)
  if (opts?.type) {
    query = query.eq("type", opts.type)
  }
  query = query.order("name")
  const { data } = await query
  return data || []
}

export async function getCategoryById(
  supabase: Supabase,
  categoryId: string,
  partnershipId: string,
) {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .eq("partnership_id", partnershipId)
    .single()
  return data
}
