import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>

export async function getPersonalAccounts(
  supabase: Supabase,
  userId: string,
) {
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_shared", false)
    .order("name")
  return data || []
}

export async function getSharedAccounts(
  supabase: Supabase,
  partnershipId: string | null,
) {
  if (!partnershipId) return []
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("partnership_id", partnershipId)
    .eq("is_shared", true)
    .order("name")
  return data || []
}

export async function getAccessibleAccounts(
  supabase: Supabase,
  userId: string,
  partnershipId: string | null,
) {
  let query = supabase
    .from("accounts")
    .select("id, name, balance, icon, type, is_shared, partnership_id, user_id")

  if (partnershipId) {
    query = query.or(
      `user_id.eq.${userId},and(is_shared.eq.true,partnership_id.eq.${partnershipId})`,
    )
  } else {
    query = query.eq("user_id", userId)
  }

  const { data: accounts } = await query
  if (!accounts) return []

  const { data: goalAccounts } = await supabase
    .from("goals")
    .select("account_id")
    .not("account_id", "is", null)

  const goalAccountIds = new Set((goalAccounts || []).map(g => g.account_id))
  return accounts.filter(a => !goalAccountIds.has(a.id))
}

export async function getAccessibleAccountIds(
  supabase: Supabase,
  userId: string,
  partnershipId: string | null,
) {
  const [personal, shared] = await Promise.all([
    supabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_shared", false),
    partnershipId
      ? supabase
          .from("accounts")
          .select("id")
          .eq("partnership_id", partnershipId)
          .eq("is_shared", true)
      : Promise.resolve({ data: [] }),
  ])

  const personalIds = personal.data?.map((a) => a.id) || []
  const sharedIds = shared.data?.map((a) => a.id) || []
  return [...new Set([...sharedIds, ...personalIds])]
}

export async function getAccountById(
  supabase: Supabase,
  accountId: string,
) {
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single()
  return data
}
