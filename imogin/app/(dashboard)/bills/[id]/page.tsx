import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageBreadcrumbs } from "@/lib/page-info"
import { getOrdinal } from "@/lib/dates"
import { getAppContext } from "@/lib/app-context"
import { getBillById } from "@/lib/queries/bills"
import { getPartnerProfile } from "@/lib/queries/profiles"

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const ctx = await getAppContext(supabase)
  if (!ctx) redirect("/auth/login")

  const { userId, partnershipId, partnerUserId } = ctx

  if (!partnershipId) redirect("/bills")

  const bill = await getBillById(supabase, id, partnershipId)

  if (!bill) redirect("/bills")

  const [partnerProfile, transactionsResult] = await Promise.all([
    partnerUserId
      ? getPartnerProfile(supabase, partnerUserId)
      : Promise.resolve(null),
    supabase
      .from("transactions")
      .select(`
        *,
        profiles!inner(name),
        accounts!inner(name, is_shared)
      `)
      .eq("bill_id", id)
      .order("date", { ascending: false }),
  ])

  const partnerName = partnerProfile?.name || null
  const transactions = transactionsResult.data

  const isOverdue = bill.next_billing_date < new Date().toISOString().split("T")[0]
  const day = bill.due_day || new Date(bill.next_billing_date).getDate()
  const cat = bill.categories as { name: string; color: string | null; icon: string | null } | null
  const acct = bill.accounts as { name: string; is_shared: boolean } | null
  const splits = bill.bill_splits as Array<{ user_id: string; percentage: number }> | null

  const splitLabel = (() => {
    if (!splits || splits.length === 0) {
      if (bill.split_method === "covered") {
        const payerIsYou = bill.split_payer_user_id === userId
        return payerIsYou ? "You pay" : `${partnerName || "Partner"} pays`
      }
      return "Equal (50/50)"
    }
    const yourSplit = splits.find(s => s.user_id === userId)
    const partnerSplit = splits.find(s => s.user_id !== userId)
    if (yourSplit && partnerSplit) return `You ${yourSplit.percentage}% / ${partnerName || "Partner"} ${partnerSplit.percentage}%`
    return bill.split_method === "equal" ? "Equal (50/50)" : bill.split_method
  })()

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={[{ label: "Bills", href: "/bills" }, { label: bill.name }]} />

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-4">
          {bill.icon_url ? (
            <img src={bill.icon_url} alt="" className="w-12 h-12 rounded-xl object-contain border" />
          ) : (
            <div className={`w-12 h-12 rounded-xl ${isOverdue ? "bg-red-100" : "bg-blue-100"} flex items-center justify-center text-lg font-bold ${isOverdue ? "text-red-600" : "text-blue-600"}`}>
              {bill.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{bill.name}</h1>
            <p className="text-sm text-muted-foreground">
              ¥{Math.abs(bill.amount).toLocaleString()} / {bill.billing_cycle}
              {isOverdue && <span className="text-red-500 ml-2 font-medium">Overdue</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Due Day</p>
          <p className="text-lg font-bold mt-1">{day}{getOrdinal(day)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Next Payment</p>
          <p className="text-lg font-bold mt-1">
            {new Date(bill.next_billing_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Category</p>
          {cat ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#6B7280" }} />
              <p className="text-lg font-bold">{cat.name}</p>
            </div>
          ) : (
            <p className="text-lg font-bold mt-1">—</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Payment Account</p>
          <p className="text-lg font-bold mt-1">{acct?.name || "—"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Split</p>
          <p className="text-lg font-bold mt-1">{splitLabel}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Website</p>
          {bill.url ? (
            <a href={bill.url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold mt-1 text-primary hover:underline inline-block">
              {new URL(bill.url).hostname.replace("www.", "")}
            </a>
          ) : (
            <p className="text-lg font-bold mt-1">—</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Linked Transactions</h2>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions linked to this bill yet</p>
        ) : (
          <div className="space-y-2">
            {(transactions as Array<{ id: string; amount: number; date: string; description: string | null; profiles: { name: string | null }; accounts: { name: string; is_shared: boolean } }>).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.description || t.accounts?.name || "Transaction"}</p>
                  <p className="text-xs text-muted-foreground">{t.date} &middot; {t.profiles?.name || "Unknown"}</p>
                </div>
                <p className="text-sm font-medium">¥{Math.abs(t.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
