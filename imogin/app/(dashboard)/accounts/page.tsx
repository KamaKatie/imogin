"use client"

import { AccountForm } from "@/components/account-form"
import Link from "next/link"
import { usePersonalAccounts } from "@/lib/hooks/use-personal-accounts"
import { useSharedAccounts } from "@/lib/hooks/use-shared-accounts"
import { useAppContext } from "@/components/app-context-provider"
import { getAccountIcon } from "@/lib/icons"

export default function AccountsPage() {
  const { partnershipId } = useAppContext()
  const { accounts: personalAccounts, isLoading: personalLoading } = usePersonalAccounts()
  const { accounts: sharedAccounts, isLoading: sharedLoading } = useSharedAccounts()

  const isLoading = personalLoading || sharedLoading

  const allAccounts = [...(personalAccounts || []), ...sharedAccounts]

  const grouped = allAccounts.reduce<Record<string, typeof allAccounts>>((acc, a) => {
    const key = a.type || "other"
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const typeOrder = ["checking", "savings", "credit", "cash", "other"]
  const sortedTypes = Object.keys(grouped).sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Manage your personal and shared accounts</p>
        <AccountForm hasPartner={!!partnershipId} />
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>Loading accounts...</p>
        </div>
      ) : allAccounts.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>No accounts yet</p>
        </div>
      ) : (
        sortedTypes.map((type) => (
          <div key={type}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{type.replace("_", " ")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[type].map((a) => (
                <Link key={a.id} href={"/accounts/" + a.id} className="rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {getAccountIcon(a.icon, a.type, 22)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.name}</p>
                      {a.is_shared && (
                        <span className="text-xs text-muted-foreground">Shared</span>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-bold">¥{Math.abs(a.balance).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
