"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
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
      // Get all accessible account IDs
      let accountIds: string[] = []
      const { data: personal } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("is_shared", false)
      accountIds.push(...(personal || []).map((a: { id: string }) => a.id))

      if (partnershipId) {
        const { data: shared } = await supabase
          .from("accounts")
          .select("id")
          .eq("partnership_id", partnershipId)
          .eq("is_shared", true)
        accountIds.push(...(shared || []).map((a: { id: string }) => a.id))
      }

      accountIds = [...new Set(accountIds)]
      return getMonthlyTransactions(supabase, accountIds, firstDay, lastDay)
    },
    { dedupingInterval: 30_000 },
  )
  return { transactions: data || [], error, isLoading }
}
