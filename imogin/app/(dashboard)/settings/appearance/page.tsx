import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DisplaySettings } from "@/components/display-settings"

export default async function AppearanceSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return (
    <div className="space-y-6 max-w-lg">
      <DisplaySettings />
    </div>
  )
}
