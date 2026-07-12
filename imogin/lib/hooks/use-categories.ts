"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import type { Database } from "@/lib/supabase/types"

type Category = Database["public"]["Tables"]["categories"]["Row"]

export function useCategories() {
  const { partnershipId } = useAppContext()

  const queryKey = `categories-${partnershipId || "none"}`

  const { data, error, isLoading } = useSupabaseFetch<Category[]>(
    queryKey,
    partnershipId
      ? async () => {
          const supabase = createClient()
          const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("partnership_id", partnershipId)
            .order("name")
          if (error) throw error
          return data || []
        }
      : null,
    { dedupingInterval: 60_000 },
  )

  return { categories: data || [], error, isLoading }
}
