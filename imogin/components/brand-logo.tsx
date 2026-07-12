"use client"

import { useState, useEffect } from "react"

const CACHE_KEY = "brand-logo-cache"
const CLIENT_ID = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID || ""

function readCache(): Record<string, string | null> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: Record<string, string | null>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

async function resolveDomain(description: string): Promise<string | null> {
  if (!CLIENT_ID || !description) return null
  try {
    const res = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(description)}?c=${CLIENT_ID}`
    )
    if (!res.ok) return null
    const results = await res.json()
    if (Array.isArray(results) && results.length > 0 && results[0].domain) {
      return results[0].domain
    }
    return null
  } catch {
    return null
  }
}

export { CACHE_KEY, CLIENT_ID, readCache, writeCache, resolveDomain }

interface BrandLogoProps {
  description: string | null
  fallback?: React.ReactNode
  size?: number
}

export function BrandLogo({ description, fallback, size = 36 }: BrandLogoProps) {
  const [domain, setDomain] = useState<string | null | undefined>(undefined)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!description) {
      setDomain(null)
      return
    }

    const key = description.trim().toUpperCase()
    const cache = readCache()

    if (key in cache) {
      setDomain(cache[key])
      return
    }

    let cancelled = false
    resolveDomain(description).then((d) => {
      if (cancelled) return
      setDomain(d)
      const cache = readCache()
      cache[key] = d
      writeCache(cache)
    })

    return () => { cancelled = true }
  }, [description])

  const showFallback = domain === undefined || !domain || imgError

  if (showFallback && !fallback) return null
  if (showFallback) return fallback as React.ReactElement

  return (
    <img
      src={`https://cdn.brandfetch.io/${domain}/fallback/404/icon?c=${CLIENT_ID}&w=${size * 2}&h=${size * 2}`}
      alt={domain}
      width={size}
      height={size}
      className="rounded-full object-contain"
      onError={() => {
        setImgError(true)
        if (description) {
          const cache = readCache()
          cache[description.trim().toUpperCase()] = null
          writeCache(cache)
        }
      }}
    />
  )
}
