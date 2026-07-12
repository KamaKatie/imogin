"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getRecentTransactions } from "@/lib/queries/transactions"

export function useRecentTransactions() {
  const { userId, partnershipId } = useAppContext()
  const { data, error, isLoading } = useSupabaseFetch(
    `recent-transactions-${userId}`,
    async () => {
      const supabase = createClient()
      let sharedIds: string[] = []
      if (partnershipId) {
        const { data: shared } = await supabase
          .from("accounts")
          .select("id")
          .eq("partnership_id", partnershipId)
          .eq("is_shared", true)
        sharedIds = (shared || []).map((a: { id: string }) => a.id)
      }
      return getRecentTransactions(supabase, userId, sharedIds)
    },
    { dedupingInterval: 30_000 },
  )
  return { transactions: data || [], error, isLoading }
}
