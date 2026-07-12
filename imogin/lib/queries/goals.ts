import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getPartnershipGoals(
  supabase: Supabase,
  userId: string,
  partnershipId: string | null,
  opts?: {
    status?: string
  },
) {
  let query = supabase
    .from("goals")
    .select("*")
    .or(
      partnershipId
        ? `user_id.eq.${userId},partnership_id.eq.${partnershipId}`
        : `user_id.eq.${userId}`,
    )
  if (opts?.status) {
    query = query.eq("status", opts.status)
  }
  query = query.order("created_at", { ascending: false })
  const { data } = await query
  return data || []
}

export async function getGoalById(
  supabase: Supabase,
  goalId: string,
) {
  const { data } = await supabase
    .from("goals")
    .select(
      `*, goal_contributions(*, profiles!goal_contributions_user_id_fkey(name, email))`,
    )
    .eq("id", goalId)
    .single()
  return data
}
