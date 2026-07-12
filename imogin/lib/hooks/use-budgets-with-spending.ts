"use client"

import { useMemo } from "react"
import { useSupabaseFetch } from "@/lib/hooks/use-supabase-query"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context-provider"
import { getBudgetsWithCategories, getBudgetSpending } from "@/lib/queries/budgets"

export function useBudgetsWithSpending() {
  const { userId, partnershipId } = useAppContext()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const { data: budgets, error: budgetsError, isLoading } = useSupabaseFetch(
    `budgets-${userId}-${partnershipId || "none"}`,
    async () => {
      const supabase = createClient()
      return getBudgetsWithCategories(supabase, userId, partnershipId)
    },
    { dedupingInterval: 60_000 },
  )

  const categoryIds = useMemo(
    () => (budgets || []).map((b: { category_id: string }) => b.category_id).filter(Boolean),
    [budgets],
  )

  const { data: spending } = useSupabaseFetch(
    `budget-spending-${categoryIds.join(",")}-${firstOfMonth}-${lastOfMonth}`,
    categoryIds.length > 0
      ? async () => {
          const supabase = createClient()
          return getBudgetSpending(supabase, categoryIds, firstOfMonth, lastOfMonth)
        }
      : null,
    { dedupingInterval: 60_000 },
  )

  const budgetsWithSpending: Array<Record<string, any> & { spent: number }> = useMemo(() => {
    return (budgets || []).map((budget: Record<string, any>) => {
      let spent = 0
      for (const t of (spending || []) as Array<{ category_id: string; user_id: string; amount: number }>) {
        if (t.category_id !== budget.category_id) continue
        if (budget.user_id && t.user_id !== userId) continue
        spent += Math.abs(t.amount)
      }
      return { ...budget, spent }
    })
  }, [budgets, spending, userId])

  return { budgetsWithSpending, error: budgetsError, isLoading }
}
