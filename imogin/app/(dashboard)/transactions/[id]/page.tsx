import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BackLink } from "@/components/back-link"
import { TransactionEditDialog } from "@/components/transaction-edit-dialog"
import { TransactionDeleteButton } from "@/components/transaction-delete-button"

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: tx, error } = await supabase
    .from("transactions")
    .select("*, accounts(name, is_shared), categories(name, color)")
    .eq("id", id)
    .single()

  if (error || !tx) {
    return (
      <div className="space-y-6">
        <BackLink />
        <h1 className="text-2xl font-bold">Transaction not found</h1>
      </div>
    )
  }

  const { data: membership } = await supabase
    .from("partnership_members")
    .select("partnership_id")
    .eq("user_id", user.id)
    .maybeSingle()

  let categories: Array<{ id: string; name: string; type: string }> = []
  if (membership?.partnership_id) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("partnership_id", membership.partnership_id)
    categories = data || []
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${tx.type === "income" ? "bg-green-500" : tx.type === "transfer" ? "bg-blue-500" : "bg-red-500"}`} />
            <h1 className="text-2xl font-bold capitalize">{tx.type}</h1>
          </div>
          <div className="flex items-center gap-2">
            <TransactionEditDialog transaction={tx} categories={categories || []} />
            <TransactionDeleteButton id={tx.id} />
          </div>
        </div>

        <p className="text-4xl font-bold mb-6">
          {tx.type === "income" ? "+" : tx.type === "transfer" ? "↔" : "-"}
          ¥{Math.abs(tx.amount).toLocaleString()}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{tx.description || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{tx.date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="font-medium">{tx.accounts?.name || "Unknown"}{tx.accounts?.is_shared ? <span className="text-xs text-primary ml-1">(shared)</span> : null}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium">{tx.categories?.name || "—"}</p>
          </div>
          {tx.notes && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{tx.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
