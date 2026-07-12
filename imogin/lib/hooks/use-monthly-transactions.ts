"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getAccessibleAccountIds } from "@/lib/queries/accounts"
import { getMonthlyTransactions } from "@/lib/queries/transactions"

export function useMonthlyTransactions() {
  const { userId, partnershipId } = useAppContext()

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const { data, error, isLoading } = useSupabaseFetch(
    `monthly-transactions-${userId}-${firstDay}`,
    async () => {
      const supabase = createClient()
      const accountIds = await getAccessibleAccountIds(supabase, userId, partnershipId)
      return getMonthlyTransactions(supabase, accountIds, firstDay, lastDay)
    },
    { dedupingInterval: 30_000 },
  )
  return { transactions: data || [], error, isLoading }
}
