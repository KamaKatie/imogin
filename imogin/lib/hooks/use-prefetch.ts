"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"

export function usePrefetch() {
  const { userId, partnershipId, partnerUserId } = useAppContext()
  const { mutate } = useSWRConfig()

  const prefetchAccounts = useCallback(async () => {
    const supabase = createClient()
    const [personal, shared] = await Promise.all([
      supabase.from("accounts").select("*").eq("user_id", userId).eq("is_shared", false).order("name"),
      partnershipId
        ? supabase.from("accounts").select("*").eq("partnership_id", partnershipId).eq("is_shared", true).order("name")
        : Promise.resolve({ data: [] as never[] }),
    ])
    mutate(`personal-accounts-${userId}`, personal.data || [], false)
    if (partnershipId) {
      mutate(`shared-accounts-${partnershipId}`, shared.data || [], false)
    }
  }, [userId, partnershipId, mutate])

  const prefetchCategories = useCallback(async () => {
    if (!partnershipId) return
    const supabase = createClient()
    const { data } = await supabase.from("categories").select("id, name, type, icon, color").eq("partnership_id", partnershipId).order("name")
    mutate(`categories-${partnershipId}`, data || [], false)
  }, [partnershipId, mutate])

  const prefetchPartnerProfile = useCallback(async () => {
    if (!partnerUserId) return
    const supabase = createClient()
    const { data } = await supabase.from("profiles").select("name, email, avatar_url").eq("id", partnerUserId).single()
    mutate(`partner-profile-${partnerUserId}`, data, false)
  }, [partnerUserId, mutate])

  const prefetchGoals = useCallback(async () => {
    const supabase = createClient()
    let query = supabase.from("goals").select("*").or(
      partnershipId
        ? `user_id.eq.${userId},partnership_id.eq.${partnershipId}`
        : `user_id.eq.${userId}`,
    ).order("created_at", { ascending: false })
    const { data } = await query
    mutate(`goals-${userId}-${partnershipId || "none"}`, data || [], false)
  }, [userId, partnershipId, mutate])

  const prefetchBills = useCallback(async () => {
    if (!partnershipId) return
    const supabase = createClient()
    const { data } = await supabase.from("bills").select("*, categories(name, color), accounts(name)").eq("partnership_id", partnershipId).eq("active", true).order("next_billing_date")
    mutate(`active-bills-${partnershipId}`, data || [], false)
  }, [partnershipId, mutate])

  const prefetchBudgets = useCallback(async () => {
    const supabase = createClient()
    const { data: budgets } = await supabase.from("budgets").select("*, categories(*)").or(
      partnershipId
        ? `user_id.eq.${userId},partnership_id.eq.${partnershipId}`
        : `user_id.eq.${userId}`,
    )
    mutate(`budgets-${userId}-${partnershipId || "none"}`, budgets || [], false)
  }, [userId, partnershipId, mutate])

  return {
    prefetchAccounts,
    prefetchCategories,
    prefetchPartnerProfile,
    prefetchGoals,
    prefetchBills,
    prefetchBudgets,
  }
}
