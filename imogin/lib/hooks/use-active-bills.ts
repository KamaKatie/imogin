"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getActiveBills } from "@/lib/queries/bills"

export function useActiveBills() {
  const { partnershipId } = useAppContext()
  const { data, error, isLoading } = useSupabaseFetch(
    `active-bills-${partnershipId || "none"}`,
    partnershipId
      ? async () => {
          const supabase = createClient()
          return getActiveBills(supabase, partnershipId)
        }
      : null,
    { dedupingInterval: 60_000 },
  )
  return { bills: data || [], error, isLoading }
}
