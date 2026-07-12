"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

type SupabaseQuery<T> = {
  from: string
  select?: string
  filters?: Record<string, unknown>
  order?: { column: string; ascending?: boolean }
  limit?: number
  single?: boolean
}

async function executeQuery<T>(client: SupabaseClient, query: SupabaseQuery<T>): Promise<T> {
  let q = client.from(query.from).select(query.select || "*")

  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      if (value === undefined || value === null) continue
      if (typeof value === "object" && "gte" in value) {
        q = q.gte(key, (value as { gte: string }).gte)
      } else if (typeof value === "object" && "lte" in value) {
        q = q.lte(key, (value as { lte: string }).lte)
      } else if (typeof value === "object" && "in" in value) {
        q = q.in(key, (value as { in: string[] }).in)
      } else if (typeof value === "object" && "eq" in value) {
        q = q.eq(key, (value as { eq: string }).eq)
      } else {
        q = q.eq(key, value as string)
      }
    }
  }

  if (query.order) {
    q = q.order(query.order.column, { ascending: query.order.ascending ?? false })
  }

  if (query.limit) {
    q = q.limit(query.limit)
  }

  if (query.single) {
    const { data, error } = await q.single()
    if (error) throw error
    return data as T
  }

  const { data, error } = await q
  if (error) throw error
  return data as T
}

export function useSupabaseQuery<T>(
  key: string,
  query: SupabaseQuery<T> | null,
  options?: { revalidateOnFocus?: boolean; dedupingInterval?: number },
) {
  const client = createClient()

  const fetcher = query
    ? () => executeQuery<T>(client, query)
    : null

  return useSWR<T>(
    query ? key : null,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? false,
      dedupingInterval: options?.dedupingInterval ?? 30_000,
      revalidateIfStale: false,
    },
  )
}

export function useSupabaseFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { revalidateOnFocus?: boolean; dedupingInterval?: number },
) {
  return useSWR<T>(
    key,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? false,
      dedupingInterval: options?.dedupingInterval ?? 30_000,
      revalidateIfStale: false,
    },
  )
}
