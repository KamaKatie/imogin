import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PartnerSettings } from "@/components/partner-settings"

export default async function PartnerSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: membership } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  let partnership: {
    id: string
    name: string | null
    share_code: string | null
    share_code_expires_at: string | null
  } | null = null
  let members: Array<{ id: string; name: string | null; email: string }> = []

  if (membership) {
    const { data: p } = await supabase
      .from("partnerships")
      .select("id, name, share_code, share_code_expires_at")
      .eq("id", membership.partnership_id)
      .single()
    partnership = p

    const { data: memberRows } = await supabase
      .from("partnership_members")
      .select("user_id")
      .eq("partnership_id", membership.partnership_id)

    const userIds = memberRows?.map((m) => m.user_id) || []
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds)
      members = (profiles || []).map((pr) => ({ id: pr.id, name: pr.name, email: pr.email }))
    }
  }

  return (
    <div className="space-y-4">
      <PartnerSettings
        partnership={partnership ? {
          id: partnership.id,
          name: partnership.name,
          shareCode: partnership.share_code,
          shareCodeExpiresAt: partnership.share_code_expires_at,
        } : null}
        members={members}
      />
    </div>
  )
}
