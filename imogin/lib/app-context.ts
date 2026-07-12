import type { SupabaseClient } from "@supabase/supabase-js"

export interface AppContext {
  userId: string
  email: string
  partnershipId: string | null
  partnerUserId: string | null
  profile: { name: string | null; email: string; avatar_url: string | null } | null
  preferences: Record<string, unknown>
}

export async function getAppContext(
  supabase: SupabaseClient,
): Promise<AppContext | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from("partnership_members")
      .select("partnership_id, user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("name, email, avatar_url, preferences")
      .eq("id", user.id)
      .single(),
  ])

  const partnershipId = membershipResult.data?.partnership_id || null
  let partnerUserId: string | null = null

  if (partnershipId) {
    const { data: members } = await supabase
      .from("partnership_members")
      .select("user_id")
      .eq("partnership_id", partnershipId)
    partnerUserId = members?.find((m) => m.user_id !== user.id)?.user_id || null
  }

  return {
    userId: user.id,
    email: user.email || "",
    partnershipId,
    partnerUserId,
    profile: profileResult.data,
    preferences: (profileResult.data?.preferences as Record<string, unknown>) || {},
  }
}
