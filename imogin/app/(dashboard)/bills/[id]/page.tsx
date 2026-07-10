import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageBreadcrumbs } from "@/lib/page-info"
import { getOrdinal } from "@/lib/dates"
import { getPartnershipId, getPartnerUserId } from "@/lib/queries"

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const partnershipId = await getPartnershipId(supabase, user.id)

  if (!partnershipId) redirect("/bills")

  const { data: bill, error } = await supabase
    .from("bills")
    .select(`
      *,
      categories(name, color, icon),
      accounts(name, is_shared),
      bill_splits(user_id, percentage)
    `)
    .eq("id", id)
    .eq("partnership_id", partnershipId)
    .single()

  if (error || !bill) redirect("/bills")

  const partnerUserId = await getPartnerUserId(supabase, partnershipId, user.id)

  let partnerName: string | null = null
  if (partnerUserId) {
    const { data: pp } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", partnerUserId)
      .single()
    partnerName = pp?.name || null
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      *,
      profiles!inner(name),
      accounts!inner(name, is_shared)
    `)
    .eq("bill_id", id)
    .order("date", { ascending: false })

  const isOverdue = bill.next_billing_date < new Date().toISOString().split("T")[0]
  const day = bill.due_day || new Date(bill.next_billing_date).getDate()
  const cat = bill.categories as { name: string; color: string | null; icon: string | null } | null
  const acct = bill.accounts as { name: string; is_shared: boolean } | null
  const splits = bill.bill_splits as Array<{ user_id: string; percentage: number }> | null

  const splitLabel = (() => {
    if (!splits || splits.length === 0) {
      if (bill.split_method === "covered") {
        const payerIsYou = bill.split_payer_user_id === user.id
        return payerIsYou ? "You pay" : `${partnerName || "Partner"} pays`
      }
      return "Equal (50/50)"
    }
    const yourSplit = splits.find(s => s.user_id === user.id)
    const partnerSplit = splits.find(s => s.user_id !== user.id)
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
