import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountForm } from "@/components/account-form"
import { getTypeIcon } from "@/lib/icons"
import { getAppContext } from "@/lib/app-context"
import Link from "next/link"

export default async function AccountsPage() {
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId, partnershipId } = ctx

  const [personalResult, sharedResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_shared", false)
      .order("name"),
    partnershipId
      ? supabase
          .from("accounts")
          .select("*")
          .eq("partnership_id", partnershipId)
          .eq("is_shared", true)
          .order("name")
      : Promise.resolve({ data: null }),
  ])

  const personalAccounts = personalResult.data
  const sharedAccounts = sharedResult.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Manage your personal and shared accounts</p>
        <AccountForm hasPartner={!!partnershipId} />
      </div>

      {sharedAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Shared Accounts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedAccounts.map((a) => (
              <Link key={a.id} href={"/accounts/" + a.id} className="rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors block">
                <div className="flex items-center gap-3 mb-3">
                  {a.icon && <img src={a.icon} alt="" className="w-9 h-9 rounded-lg object-contain shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                      {getTypeIcon(a.type, 10)}
                      {a.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <p className="text-2xl font-bold">¥{Math.abs(a.balance).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Personal Accounts</h2>
        {!personalAccounts || personalAccounts.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <p>No personal accounts yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personalAccounts.map((a) => (
              <Link key={a.id} href={"/accounts/" + a.id} className="rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors block">
                <div className="flex items-center gap-3 mb-3">
                  {a.icon && <img src={a.icon} alt="" className="w-9 h-9 rounded-lg object-contain shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                      {getTypeIcon(a.type, 10)}
                      {a.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <p className="text-2xl font-bold">¥{Math.abs(a.balance).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
