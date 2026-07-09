import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { PartnerSettings } from "@/components/partner-settings"
import { CategoriesManager } from "@/components/categories-manager"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  const partnershipId = partnership?.id || null

  const { data: categories } = partnershipId ? await supabase
    .from("categories")
    .select("id, name, icon, color, type")
    .eq("partnership_id", partnershipId)
    .order("name") : { data: [] }

  let partner: { name: string | null; email: string } | null = null
  if (partnership) {
    const partnerId = partnership.user1_id === user.id ? partnership.user2_id : partnership.user1_id
    if (partnerId) {
      const { data: p } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", partnerId)
        .single()
      partner = p
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">Manage your profile, partnership, and preferences</p>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <ProfileForm profile={profile} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Partnership</h2>
        <PartnerSettings
          partnership={partnership ? {
            id: partnership.id,
            shareCode: partnership.share_code,
            shareCodeExpiresAt: partnership.share_code_expires_at,
            user2Id: partnership.user2_id,
          } : null}
          partner={partner}
        />
      </div>

      {partnershipId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Categories</h2>
          <CategoriesManager categories={categories || []} />
        </div>
      )}
    </div>
  )
}
