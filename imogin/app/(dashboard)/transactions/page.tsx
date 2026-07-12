"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { useAccessibleAccounts } from "@/lib/hooks/use-accessible-accounts"
import { usePartnershipCategories } from "@/lib/hooks/use-partnership-categories"
import { usePartnerProfile } from "@/lib/hooks/use-partner-profile"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionsTable, type TransactionRow, type FilterOption } from "@/components/transactions-table"
import { TransactionCardList } from "@/components/transaction-card-list"
import { MobileFab } from "@/components/mobile-fab"

function pickFirst<T>(val: T | T[]): T {
  return Array.isArray(val) ? val[0] : val
}

export default function TransactionsPage() {
  const { userId, partnershipId, partnerUserId, profile: userProfile, preferences } = useAppContext()
  const searchParams = useSearchParams()
  const router = useRouter()

  const page = Math.max(1, parseInt(searchParams.get("page") || "") || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "") || 25))
  const q = searchParams.get("q") || ""
  const sort = searchParams.get("sort") || "date"
  const order = searchParams.get("order") || "desc"
  const accountFilter = searchParams.get("account") || ""
  const categoryFilter = searchParams.get("category") || ""
  const payerFilter = searchParams.get("payer") || ""

  const { accounts: allAccounts, isLoading: accountsLoading } = useAccessibleAccounts()
  const { categories, isLoading: categoriesLoading, mutate: categoriesMutate } = usePartnershipCategories()
  const { profile: partnerProfile, isLoading: profileLoading } = usePartnerProfile()

  const accessibleAccountIds = useMemo(() => allAccounts.map((a) => a.id), [allAccounts])

  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  const sanitizedSort = ["date", "amount", "description"].includes(sort) ? sort : "date"
  const dir = order === "asc" ? "asc" : "desc"

  const txKey = accessibleAccountIds.length > 0
    ? `transactions-${JSON.stringify({ page, pageSize, q, sort: sanitizedSort, order: dir, accountFilter, categoryFilter, payerFilter })}`
    : null

  const { data: txData, isLoading: txLoading, mutate: txMutate } = useSWR(
    txKey,
    async () => {
      const supabase = createClient()
      let query = supabase
        .from("transactions")
        .select(
          `id, amount, description, date, type, is_split, user_id,
           accounts!account_id(id, name, is_shared),
           categories(id, name, type, icon, color)`,
          { count: "exact" },
        )
        .in("account_id", accessibleAccountIds)

      if (q) {
        const safeQ = q.replace(/[%_]/g, "\\$&")
        query = query.or(`description.ilike.%${safeQ}%,notes.ilike.%${safeQ}%`)
      }
      if (accountFilter) query = query.eq("account_id", accountFilter)
      if (categoryFilter) query = query.eq("category_id", categoryFilter)
      if (payerFilter) query = query.eq("user_id", payerFilter)

      const { data, count } = await query
        .order(sanitizedSort, { ascending: dir === "asc" })
        .range(start, end)

      const userIds = [...new Set((data || []).map((t: { user_id: string }) => t.user_id))]
      let profileMap = new Map<string, string>()
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds)
        for (const p of profiles || []) {
          profileMap.set(p.id, p.name || p.id)
        }
      }

      const rows = (data || []).map((t: Record<string, any>) => ({
        id: t.id as string,
        amount: t.amount as number,
        description: t.description as string,
        date: t.date as string,
        type: t.type as string,
        is_split: t.is_split as boolean,
        user_id: t.user_id as string,
        payer_name: profileMap.get(t.user_id as string) || "Unknown",
        accounts: pickFirst(t.accounts) as TransactionRow["accounts"],
        categories: pickFirst(t.categories) as TransactionRow["categories"],
      }))

      return { rows, totalCount: count || 0 }
    },
    { dedupingInterval: 10_000 },
  )

  const filterAccounts: FilterOption[] = allAccounts.map((a) => ({
    id: a.id,
    label: a.name,
  }))

  const filterCategories: FilterOption[] = categories.map((c: { id: string; name: string }) => ({
    id: c.id,
    label: c.name,
  }))

  const filterPayers: FilterOption[] = []
  if (userProfile) {
    filterPayers.push({ id: userId, label: userProfile.name || userProfile.email || "You" })
  }
  if (partnerProfile && partnerUserId) {
    filterPayers.push({ id: partnerUserId, label: partnerProfile.name || partnerProfile.email || "Partner" })
  }

  const isInitialLoading = accountsLoading || (txLoading && !txData)

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-64 bg-muted animate-pulse rounded" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  const transactionView = (preferences.transactionView as string) || "table"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Personal and shared transactions</p>
        <TransactionForm
          accounts={allAccounts}
          categories={categories}
          partnershipId={partnershipId}
          partnerUserId={partnerUserId}
          userProfile={userProfile}
          partnerProfile={partnerProfile ?? null}
          onSuccess={() => txMutate()}
          onCategoriesChange={() => categoriesMutate()}
        />
      </div>

      {transactionView === "cards" ? (
        <TransactionCardList data={txData?.rows || []} />
      ) : (
        <TransactionsTable
          data={txData?.rows || []}
          totalCount={txData?.totalCount || 0}
          page={page}
          pageSize={pageSize}
          search={q}
          sort={sanitizedSort}
          sortDir={dir}
          accounts={filterAccounts}
          categories={filterCategories}
          payers={filterPayers}
        />
      )}

      <MobileFab
        accounts={allAccounts}
        categories={categories}
        partnershipId={partnershipId}
        partnerUserId={partnerUserId}
        userProfile={userProfile}
        partnerProfile={partnerProfile ?? null}
        onSuccess={() => txMutate()}
        onCategoriesChange={() => categoriesMutate()}
      />
    </div>
  )
}
