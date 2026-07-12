"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getPersonalAccounts, getSharedAccounts } from "@/lib/queries/accounts"
import { getPartnershipCategories } from "@/lib/queries/categories"
import { getPartnerProfile } from "@/lib/queries/profiles"
import { getPartnershipGoals } from "@/lib/queries/goals"
import { getActiveBills } from "@/lib/queries/bills"
import { getBudgetsWithCategories } from "@/lib/queries/budgets"

export function usePrefetch() {
  const { userId, partnershipId, partnerUserId } = useAppContext()
  const { mutate } = useSWRConfig()

  const prefetchAccounts = useCallback(async () => {
    const supabase = createClient()
    const [personal, shared] = await Promise.all([
      getPersonalAccounts(supabase, userId),
      partnershipId ? getSharedAccounts(supabase, partnershipId) : Promise.resolve([]),
    ])
    mutate(`personal-accounts-${userId}`, personal, false)
    if (partnershipId) {
      mutate(`shared-accounts-${partnershipId}`, shared, false)
    }
  }, [userId, partnershipId, mutate])

  const prefetchCategories = useCallback(async () => {
    if (!partnershipId) return
    const supabase = createClient()
    const data = await getPartnershipCategories(supabase, partnershipId)
    mutate(`categories-${partnershipId}`, data || [], false)
  }, [partnershipId, mutate])

  const prefetchPartnerProfile = useCallback(async () => {
    if (!partnerUserId) return
    const supabase = createClient()
    const data = await getPartnerProfile(supabase, partnerUserId)
    mutate(`partner-profile-${partnerUserId}`, data, false)
  }, [partnerUserId, mutate])

  const prefetchGoals = useCallback(async () => {
    const supabase = createClient()
    const data = await getPartnershipGoals(supabase, userId, partnershipId)
    mutate(`goals-${userId}-${partnershipId || "none"}`, data || [], false)
  }, [userId, partnershipId, mutate])

  const prefetchBills = useCallback(async () => {
    if (!partnershipId) return
    const supabase = createClient()
    const data = await getActiveBills(supabase, partnershipId)
    mutate(`active-bills-${partnershipId}`, data || [], false)
  }, [partnershipId, mutate])

  const prefetchBudgets = useCallback(async () => {
    const supabase = createClient()
    const data = await getBudgetsWithCategories(supabase, userId, partnershipId)
    mutate(`budgets-${userId}-${partnershipId || "none"}`, data || [], false)
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
