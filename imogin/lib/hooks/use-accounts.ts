"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import type { Database } from "@/lib/supabase/types"

type Account = Database["public"]["Tables"]["accounts"]["Row"]

export function useAccounts() {
  const { userId, partnershipId } = useAppContext()

  const queryKey = `accounts-${userId}-${partnershipId || "none"}`

  const { data, error, isLoading } = useSupabaseFetch<Account[]>(
    queryKey,
    async () => {
      const supabase = createClient()
      let query = supabase
        .from("accounts")
        .select("*")
      if (partnershipId) {
        query = query.or(
          `user_id.eq.${userId},and(is_shared.eq.true,partnership_id.eq.${partnershipId})`,
        )
      } else {
        query = query.eq("user_id", userId)
      }
      const { data, error } = await query.order("name")
      if (error) throw error
      return data || []
    },
    { dedupingInterval: 60_000 },
  )

  return { accounts: data || [], error, isLoading }
}
