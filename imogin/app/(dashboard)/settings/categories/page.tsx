import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CategoryManager } from "@/components/category-manager"

export default async function CategoriesSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  const partnershipId = partnership?.id || null

  let categories: unknown[] = []
  if (partnershipId) {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("partnership_id", partnershipId)
      .order("name")
    categories = data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground">Manage your spending categories</p>
      </div>
      <CategoryManager
        categories={categories as Array<{ id: string; name: string; icon: string | null; color: string | null; type: string }>}
        hasPartner={!!partnershipId}
      />
    </div>
  )
}
