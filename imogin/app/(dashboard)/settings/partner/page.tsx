import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PartnerSettings } from "@/components/partner-settings"
import { getAppContext } from "@/lib/app-context"
import { getPartnershipDetails, getPartnershipMembers } from "@/lib/queries/partnerships"
import { getProfilesByIds } from "@/lib/queries/profiles"

export default async function PartnerSettingsPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { partnershipId } = ctx

  let partnership: {
    id: string
    name: string | null
    share_code: string | null
    share_code_expires_at: string | null
  } | null = null
  let members: Array<{ id: string; name: string | null; email: string }> = []

  if (partnershipId) {
    const [p, memberRows] = await Promise.all([
      getPartnershipDetails(supabase, partnershipId),
      getPartnershipMembers(supabase, partnershipId),
    ])
    partnership = p

    const userIds = memberRows?.map((m) => m.user_id) || []
    if (userIds.length > 0) {
      const profiles = await getProfilesByIds(supabase, userIds)
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
