import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CategoriesManager } from "@/components/categories-manager"
import { getPartnershipId } from "@/lib/queries"

export default async function CategoriesSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

  if (!partnershipId) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Create a partnership to manage categories.</p>
      </div>
    )
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon, color, type")
    .eq("partnership_id", partnershipId)
    .order("name")

  return (
    <div className="space-y-6">
      <CategoriesManager categories={categories || []} />
    </div>
  )
}
