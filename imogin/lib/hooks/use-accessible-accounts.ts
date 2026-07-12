"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getAccessibleAccounts } from "@/lib/queries/accounts"

export function useAccessibleAccounts() {
  const { userId, partnershipId } = useAppContext()
  const { data, error, isLoading, mutate } = useSupabaseFetch(
    `accessible-accounts-${userId}-${partnershipId || "none"}`,
    async () => {
      const supabase = createClient()
      return getAccessibleAccounts(supabase, userId, partnershipId)
    },
    { dedupingInterval: 60_000 },
  )
  return { accounts: data || [], error, isLoading, mutate }
}
