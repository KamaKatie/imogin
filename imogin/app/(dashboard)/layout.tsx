import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { PageInfoProvider } from "@/lib/page-info"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
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
