import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { PageInfoProvider } from "@/lib/page-info"
import { getPartnershipId } from "@/lib/queries"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [{ data: profile }, partnershipId] = await Promise.all([
    supabase.from("profiles").select("name, email, avatar_url").eq("id", user.id).single(),
    getPartnershipId(supabase, user.id),
  ])

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, balance, icon, type")
    .or(
      partnershipId
        ? `user_id.eq.${user.id},and(is_shared.eq.true,partnership_id.eq.${partnershipId})`
        : `user_id.eq.${user.id}`,
    )
    .order("name")

  const sidebarProfile = {
    name: profile?.name || profile?.email || user.email || "",
    avatarUrl: profile?.avatar_url || "",
  }

  return (
    <div className="flex h-screen">
      <Sidebar profile={sidebarProfile} accounts={accounts || []} />
      <div className="flex flex-col flex-1 lg:ml-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 pb-20 lg:pb-6">
          <PageInfoProvider>
            {children}
          </PageInfoProvider>
        </main>
      </div>
    </div>
  )
}
