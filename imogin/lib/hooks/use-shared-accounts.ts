"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getSharedAccounts } from "@/lib/queries/accounts"

export function useSharedAccounts() {
  const { partnershipId } = useAppContext()
  const { data, error, isLoading } = useSupabaseFetch(
    `shared-accounts-${partnershipId || "none"}`,
    partnershipId
      ? async () => {
          const supabase = createClient()
          return getSharedAccounts(supabase, partnershipId)
        }
      : null,
    { dedupingInterval: 60_000 },
  )
  return { accounts: data || [], error, isLoading }
}
