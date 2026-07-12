"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getPersonalAccounts } from "@/lib/queries/accounts"

export function usePersonalAccounts() {
  const { userId } = useAppContext()
  const { data, error, isLoading } = useSupabaseFetch(
    `personal-accounts-${userId}`,
    async () => {
      const supabase = createClient()
      return getPersonalAccounts(supabase, userId)
    },
    { dedupingInterval: 60_000 },
  )
  return { accounts: data || [], error, isLoading }
}
