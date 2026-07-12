import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { PageInfoProvider } from "@/lib/page-info"
import { getAppContext } from "@/lib/app-context"
import { AppContextProvider } from "@/components/app-context-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, balance, icon, type")
    .or(
      ctx.partnershipId
        ? `user_id.eq.${ctx.userId},and(is_shared.eq.true,partnership_id.eq.${ctx.partnershipId})`
        : `user_id.eq.${ctx.userId}`,
    )
    .order("name")

  const sidebarProfile = {
    name: ctx.profile?.name || ctx.profile?.email || ctx.email || "",
    avatarUrl: ctx.profile?.avatar_url || "",
  }

  return (
    <div className="flex h-screen">
      <Sidebar profile={sidebarProfile} accounts={accounts || []} />
      <div className="flex flex-col flex-1 lg:ml-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 pb-20 lg:pb-6">
          <PageInfoProvider>
            <AppContextProvider data={ctx}>
              {children}
            </AppContextProvider>
          </PageInfoProvider>
        </main>
      </div>
    </div>
  )
}
