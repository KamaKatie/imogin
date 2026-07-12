"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getPartnerProfile } from "@/lib/queries/profiles"

export function usePartnerProfile() {
  const { partnerUserId } = useAppContext()
  const { data, error, isLoading } = useSupabaseFetch(
    `partner-profile-${partnerUserId || "none"}`,
    partnerUserId
      ? async () => {
          const supabase = createClient()
          return getPartnerProfile(supabase, partnerUserId)
        }
      : null,
    { dedupingInterval: 120_000 },
  )
  return { profile: data, error, isLoading }
}
