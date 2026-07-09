import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SubscriptionForm } from "@/components/subscription-form"

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: partnership } = await supabase
    .from("partnerships")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  const partnershipId = partnership?.id || null

  if (!partnershipId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Track shared recurring expenses</p>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>Create a partnership to track shared subscriptions</p>
          <Link href="/settings" className="text-primary hover:underline text-sm mt-2 inline-block">
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories(name, color),
      accounts(name)
    `)
    .eq("partnership_id", partnershipId)
    .eq("active", true)
    .order("next_billing_date")

  const totalMonthly = subscriptions?.reduce((sum, s) => {
    const amount = Math.abs(s.amount)
    switch (s.billing_cycle) {
      case "weekly": return sum + amount * 4.33
      case "monthly": return sum + amount
      case "quarterly": return sum + amount / 3
      case "yearly": return sum + amount / 12
      default: return sum
    }
  }, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Track shared recurring expenses</p>
        <div className="flex gap-2">
          <Link
            href="/subscriptions/calendar"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Calendar View
          </Link>
          <SubscriptionForm />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Monthly Total</p>
        <p className="text-3xl font-bold mt-1">¥{totalMonthly.toLocaleString()}</p>
      </div>

      {!subscriptions || subscriptions.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>No subscriptions yet</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="divide-y">
            {subscriptions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${s.next_billing_date < new Date().toISOString().split("T")[0] ? "bg-red-500" : "bg-blue-500"}`} />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.description && <span>{s.description} &middot; </span>}
                      Due {s.next_billing_date} &middot; {s.billing_cycle}
                      {(s.categories as { name: string } | null)?.name && <span> &middot; {(s.categories as { name: string }).name}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">¥{Math.abs(s.amount).toLocaleString()}</p>
                  <p className={`text-xs ${s.split_method === "equal" ? "text-blue-500" : s.split_method === "custom" ? "text-orange-500" : "text-green-500"}`}>
                    {s.split_method === "equal" ? "50/50" : s.split_method === "covered" ? "Covered" : "Custom"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
