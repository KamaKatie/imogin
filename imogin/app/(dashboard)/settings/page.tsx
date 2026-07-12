import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { getAppContext } from "@/lib/app-context"

export default async function SettingsPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  return (
    <div className="space-y-4">
      <ProfileForm profile={ctx.profile as never} />
    </div>
  )
}
