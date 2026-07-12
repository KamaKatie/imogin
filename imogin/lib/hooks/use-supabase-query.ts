"use client"

import useSWR from "swr"

export function useSupabaseFetch<T>(
  key: string,
  fetcher: (() => Promise<T>) | null,
  options?: { revalidateOnFocus?: boolean; dedupingInterval?: number },
) {
  return useSWR<T>(
    fetcher ? key : null,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? false,
      dedupingInterval: options?.dedupingInterval ?? 30_000,
      revalidateIfStale: false,
    },
  )
}
