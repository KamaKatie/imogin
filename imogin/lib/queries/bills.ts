import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getActiveBills(
  supabase: Supabase,
  partnershipId: string | null,
) {
  if (!partnershipId) return []
  const { data } = await supabase
    .from("bills")
    .select(`*, categories(name, color), accounts(name)`)

    .eq("partnership_id", partnershipId)
    .eq("active", true)
    .order("next_billing_date")
  return data || []
}

export async function getBillById(
  supabase: Supabase,
  billId: string,
  partnershipId?: string,
) {
  let query = supabase
    .from("bills")
    .select(
      `*, categories(name, color, icon), accounts(name, is_shared), bill_splits(user_id, percentage)`,
    )
    .eq("id", billId)
  if (partnershipId) {
    query = query.eq("partnership_id", partnershipId)
  }
  const { data } = await query.single()
  return data
}
