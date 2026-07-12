"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getPartnershipGoals } from "@/lib/queries/goals"

export function usePartnershipGoals() {
  const { userId, partnershipId } = useAppContext()
  const { data, error, isLoading } = useSupabaseFetch(
    `goals-${userId}-${partnershipId || "none"}`,
    async () => {
      const supabase = createClient()
      return getPartnershipGoals(supabase, userId, partnershipId)
    },
    { dedupingInterval: 60_000 },
  )
  return { goals: data || [], error, isLoading }
}
