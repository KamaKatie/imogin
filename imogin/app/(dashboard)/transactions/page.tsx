import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TransactionForm } from "@/components/transaction-form"

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  const partnershipId = partnership?.id || null

  let allTxns: unknown[] = []

  if (partnershipId) {
    const { data: sharedAccounts } = await supabase
      .from("accounts")
      .select("id")
      .eq("partnership_id", partnershipId)
      .eq("is_shared", true)

    const sharedAccountIds = sharedAccounts?.map(a => a.id) || []

    const { data } = await supabase
      .from("transactions")
      .select(`
        *,
        accounts!inner(*),
        categories(*),
        transaction_splits(*)
      `)
      .or(
        `user_id.eq.${user.id},account_id.in.(${sharedAccountIds.length > 0 ? sharedAccountIds.join(",") : "'none'"})`
      )
      .order("date", { ascending: false })
      .limit(100)

    allTxns = data || []
  } else {
    const { data } = await supabase
      .from("transactions")
      .select(`
        *,
        accounts(*),
        categories(*),
        transaction_splits(*)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100)

    allTxns = data || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Personal and shared transactions</p>
        </div>
        <TransactionForm />
      </div>

      <div className="rounded-xl border bg-card">
        {allTxns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {(allTxns as Array<{
              id: string; amount: number; description: string | null; date: string; type: string;
              is_split: boolean; accounts: { name: string; is_shared: boolean } | null;
              categories: { name: string; color: string | null } | null;
              transaction_splits: Array<{ user_id: string; amount: number }> | null
            }>).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${t.type === "income" ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-medium">{t.description || "No description"}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.date} &middot; {t.accounts?.name || "Unknown account"}
                      {t.accounts?.is_shared && <span className="ml-1 text-primary">(shared)</span>}
                      {t.is_split && <span className="ml-1 text-orange-500">(split)</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}¥{Math.abs(t.amount).toLocaleString()}
                  </p>
                  {t.categories && (
                    <p className="text-xs text-muted-foreground">{t.categories.name}</p>
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
