import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BackLink } from "@/components/back-link"

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single()

  if (!account) {
    return (
      <div className="space-y-6">
        <BackLink />
        <h1 className="text-2xl font-bold">Account not found</h1>
      </div>
    )
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, categories(name, color)")
    .eq("account_id", id)
    .order("date", { ascending: false })
    .limit(50)

  const accountTypeIcons: Record<string, string> = {
    checking: "\u{1F3E6}", savings: "\u{1F4B0}", credit_card: "\u{1F4B3}",
    cash: "\u{1F4B5}", investment: "\u{1F4C8}", other: "\u{1F3F7}\uFE0F",
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{accountTypeIcons[account.type] || "\u{1F3F7}\uFE0F"}</span>
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{account.type.replace("_", " ")}</p>
          </div>
        </div>
        <p className="text-3xl font-bold mt-2">&yen;{Math.abs(account.balance).toLocaleString()}</p>
        {account.is_shared && <span className="text-xs text-primary">Shared account</span>}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Transactions</h2>
        {!transactions || transactions.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <p>No transactions for this account</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y">
            {transactions.map((t: Record<string, unknown>) => (
              <div key={t.id as string} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={"w-2 h-2 rounded-full " + (t.type === "income" ? "bg-green-500" : t.type === "transfer" ? "bg-blue-500" : "bg-red-500")} />
                  <div>
                    <p className="text-sm font-medium">{(t.description as string) || (t.type === "transfer" ? "Transfer" : "No description")}</p>
                    <p className="text-xs text-muted-foreground">{t.date as string}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={"text-sm font-medium " + (t.type === "income" ? "text-green-600" : t.type === "transfer" ? "text-blue-600" : "text-red-600")}>
                    {t.type === "income" ? "+" : t.type === "transfer" ? "\u2194" : "-"}&yen;{Math.abs(t.amount as number).toLocaleString()}
                  </p>
                  {(t.categories as { name: string } | null)?.name && (
                    <p className="text-xs text-muted-foreground">{(t.categories as { name: string }).name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
