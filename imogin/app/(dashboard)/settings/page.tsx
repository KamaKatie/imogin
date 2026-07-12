import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { getAppContext } from "@/lib/app-context"
import { getProfileById } from "@/lib/queries/profiles"

export default async function SettingsPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId } = ctx

  const profile = await getProfileById(supabase, userId)

  return (
    <div className="space-y-4">
      <ProfileForm profile={profile} />
    </div>
  )
}
