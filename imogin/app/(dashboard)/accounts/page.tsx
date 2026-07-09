import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountForm } from "@/components/account-form"
import Link from "next/link"

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  const partnershipId = partnership?.id || null

  const { data: personalAccounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_shared", false)
    .order("name")

  let sharedAccounts: Array<{ id: string; name: string; type: string; balance: number; color: string | null; icon: string | null }> = []

  if (partnershipId) {
    const { data: shared } = await supabase
      .from("accounts")
      .select("*")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)
      .order("name")
    sharedAccounts = shared || []
  }

  const accountTypeIcons: Record<string, string> = {
    checking: "🏦",
    savings: "💰",
    credit_card: "💳",
    cash: "💵",
    investment: "📈",
    other: "🏷️",
  }

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
              <Link key={a.id} href={"/accounts/" + a.id} className="rounded-xl border bg-card p-5" style={{ borderLeftColor: a.color || undefined, borderLeftWidth: 4 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{accountTypeIcons[a.type] || accountTypeIcons.other}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full capitalize">{a.type.replace("_", " ")}</span>
                </div>
                <p className="font-medium">{a.name}</p>
                <p className="text-2xl font-bold mt-1">¥{Math.abs(a.balance).toLocaleString()}</p>
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
              <Link key={a.id} href={"/accounts/" + a.id} className="rounded-xl border bg-card p-5 block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{accountTypeIcons[a.type] || accountTypeIcons.other}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full capitalize">{a.type.replace("_", " ")}</span>
                </div>
                <p className="font-medium">{a.name}</p>
                <p className="text-2xl font-bold mt-1">¥{Math.abs(a.balance).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
