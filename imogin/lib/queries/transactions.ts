import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getMonthlyTransactions(
  supabase: Supabase,
  accountIds: string[],
  startDate: string,
  endDate: string,
) {
  if (accountIds.length === 0) return []
  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name, color, icon)")
    .in("account_id", accountIds)
    .gte("date", startDate)
    .lte("date", endDate)
  return data || []
}

export async function getTransactionsForAccount(
  supabase: Supabase,
  accountId: string,
) {
  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name, color, icon), accounts!account_id(id, name, is_shared)")
    .eq("account_id", accountId)
    .order("date", { ascending: false })
    .limit(50)
  return data || []
}

export async function getTransactionById(
  supabase: Supabase,
  transactionId: string,
) {
  const { data } = await supabase
    .from("transactions")
    .select(
      `*, accounts!account_id(name, is_shared), categories(name, color, icon)`,
    )
    .eq("id", transactionId)
    .single()
  return data
}

export async function getRecentTransactions(
  supabase: Supabase,
  userId: string,
  sharedAccountIds: string[],
) {
  if (sharedAccountIds.length > 0) {
    const { data } = await supabase
      .from("transactions")
      .select(`*, accounts!account_id!inner(name, is_shared)`)
      .or(`user_id.eq.${userId},account_id.in.(${sharedAccountIds.join(",")})`)
      .order("date", { ascending: false })
      .limit(5)
    return data || []
  }
  const { data } = await supabase
    .from("transactions")
    .select(`*, accounts!account_id!inner(name, is_shared)`)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(5)
  return data || []
}
