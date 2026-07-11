import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { PageInfoProvider } from "@/lib/page-info"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return (
    <div className="flex h-screen">
      <Sidebar refreshKey={Date.now()} />
      <div className="flex flex-col flex-1 ml-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <PageInfoProvider>
            {children}
          </PageInfoProvider>
        </main>
      </div>
    </div>
  )
}
