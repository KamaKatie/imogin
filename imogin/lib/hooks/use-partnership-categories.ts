"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getPartnershipCategories } from "@/lib/queries/categories"

export function usePartnershipCategories() {
  const { partnershipId } = useAppContext()
  const { data, error, isLoading } = useSupabaseFetch(
    `categories-${partnershipId || "none"}`,
    partnershipId
      ? async () => {
          const supabase = createClient()
          return getPartnershipCategories(supabase, partnershipId)
        }
      : null,
    { dedupingInterval: 60_000 },
  )
  return { categories: data || [], error, isLoading }
}
