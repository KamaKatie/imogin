import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getBudgetsWithCategories(
  supabase: Supabase,
  userId: string,
  partnershipId: string | null,
) {
  const { data } = await supabase
    .from("budgets")
    .select("*, categories(*)")
    .or(
      partnershipId
        ? `user_id.eq.${userId},partnership_id.eq.${partnershipId}`
        : `user_id.eq.${userId}`,
    )
  return data || []
}

export async function getBudgetSpending(
  supabase: Supabase,
  categoryIds: string[],
  startDate: string,
  endDate: string,
) {
  if (categoryIds.length === 0) return []
  const { data } = await supabase
    .from("transactions")
    .select("amount, category_id, user_id")
    .in("category_id", categoryIds)
    .eq("type", "expense")
    .gte("date", startDate)
    .lte("date", endDate)
  return data || []
}
