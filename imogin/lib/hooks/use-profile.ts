"use client"

import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"

interface Profile {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
}

export function useProfile(userId?: string) {
  const ctx = useAppContext()
  const targetId = userId || ctx.userId

  const queryKey = `profile-${targetId}`

  const { data, error, isLoading } = useSupabaseFetch<Profile>(
    queryKey,
    async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .eq("id", targetId)
        .single()
      if (error) throw error
      return data
    },
    { dedupingInterval: 120_000 },
  )

  return { profile: data, error, isLoading }
}
