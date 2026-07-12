"use client"

import Link from "next/link"
import { BillForm } from "@/components/bill-form"
import { BillEditDialog } from "@/components/bill-edit-dialog"
import { getOrdinal } from "@/lib/dates"
import { useAppContext } from "@/components/app-context-provider"
import { usePartnershipCategories } from "@/lib/hooks/use-partnership-categories"
import { usePersonalAccounts } from "@/lib/hooks/use-personal-accounts"
import { useSharedAccounts } from "@/lib/hooks/use-shared-accounts"
import { usePartnerProfile } from "@/lib/hooks/use-partner-profile"
import { useActiveBills } from "@/lib/hooks/use-active-bills"

function formatDueDay(day: number | null, dateStr: string) {
  if (day) return `Due on the ${day}${getOrdinal(day)}`
  const d = new Date(dateStr)
  return `Due ${d.getDate()}${getOrdinal(d.getDate())}`
}

export default function BillsPage() {
  const { userId, partnershipId, partnerUserId } = useAppContext()
  const { categories, isLoading: catLoading } = usePartnershipCategories()
  const { accounts: personalAccounts, isLoading: personalLoading } = usePersonalAccounts()
  const { accounts: sharedAccounts, isLoading: sharedLoading } = useSharedAccounts()
  const { profile, isLoading: profileLoading } = usePartnerProfile()
  const { bills, isLoading: billsLoading } = useActiveBills()

  const isLoading = catLoading || personalLoading || sharedLoading || profileLoading || billsLoading

  const accounts = [...personalAccounts, ...sharedAccounts]
  const partnerName = profile?.name || null

  if (!partnershipId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Track shared recurring expenses</p>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>Create a partnership to track shared bills</p>
          <Link href="/settings" className="text-primary hover:underline text-sm mt-2 inline-block">
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Track shared recurring expenses</p>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const totalMonthly = bills?.reduce((sum, s) => {
    const amount = Math.abs(s.amount)
    switch (s.billing_cycle) {
      case "weekly": return sum + amount * 4.33
      case "monthly": return sum + amount
      case "quarterly": return sum + amount / 3
      case "yearly": return sum + amount / 12
      default: return sum
    }
  }, 0) || 0

  const partnerDisplayName = partnerName || "Partner"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Track shared recurring expenses</p>
        <div className="flex gap-2">
          <Link
            href="/bills/calendar"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Calendar View
          </Link>
          <BillForm
            categories={categories || []}
            accounts={accounts}
            userId={userId}
            partnerUserId={partnerUserId || undefined}
            partnerName={partnerDisplayName}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Monthly Total</p>
        <p className="text-3xl font-bold mt-1">¥{totalMonthly.toLocaleString()}</p>
      </div>

      {!bills || bills.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>No bills yet</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="divide-y">
            {bills.map((s) => {
              const isOverdue = s.next_billing_date < new Date().toISOString().split("T")[0]
              const accountName = (s.accounts as { name: string } | null)?.name
              return (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {s.icon_url ? (
                      <img src={s.icon_url} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0" />
                    ) : (
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? "bg-red-500" : "bg-blue-500"}`} />
                    )}
                    <div className="min-w-0">
                      <Link href={`/bills/${s.id}`} className="text-sm font-medium truncate hover:text-primary transition-colors">{s.name}</Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDueDay(s.due_day, s.next_billing_date)} &middot; {s.billing_cycle}
                        {(s.categories as { name: string } | null)?.name && <span> &middot; {(s.categories as { name: string }).name}</span>}
                        {accountName && <span> &middot; {accountName}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium">¥{Math.abs(s.amount).toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-2">
                      <p className={`text-xs ${s.split_method === "equal" ? "text-blue-500" : s.split_method === "custom" ? "text-orange-500" : "text-green-500"}`}>
                        {s.split_method === "equal" ? "50/50" : s.split_method === "covered" ? "Covered" : "Custom"}
                      </p>
                      <BillEditDialog
                        bill={{
                          id: s.id,
                          name: s.name,
                          amount: s.amount,
                          billing_cycle: s.billing_cycle,
                          next_billing_date: s.next_billing_date,
                          due_day: s.due_day,
                          category_id: s.category_id,
                          payment_account_id: s.payment_account_id,
                          split_method: s.split_method,
                          split_payer_user_id: s.split_payer_user_id,
                          icon_url: s.icon_url,
                          url: s.url,
                        }}
                        categories={categories || []}
                        accounts={accounts}
                        userId={userId}
                        partnerUserId={partnerUserId || undefined}
                        partnerName={partnerDisplayName}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
