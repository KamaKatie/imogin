"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search } from "lucide-react"
import { CLIENT_ID, CACHE_KEY, readCache, writeCache, resolveDomain } from "@/components/brand-logo"

interface SearchResult {
  domain: string
  name: string | null
  icon: string | null
}

async function searchBrands(query: string): Promise<SearchResult[]> {
  if (!CLIENT_ID || !query) return []
  try {
    const res = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}?c=${CLIENT_ID}`
    )
    if (!res.ok) return []
    const results = await res.json()
    return Array.isArray(results) ? results.slice(0, 8) : []
  } catch {
    return []
  }
}

interface BrandLogoPickerProps {
  description: string | null
  size?: number
}

export function BrandLogoPicker({ description, size = 48 }: BrandLogoPickerProps) {
  const [domain, setDomain] = useState<string | null | undefined>(undefined)
  const [imgError, setImgError] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!description) { setDomain(null); return }
    const key = description.trim().toUpperCase()
    const cache = readCache()
    if (key in cache) { setDomain(cache[key]); return }
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

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setSearchQuery(description || "")
    }
  }, [open, description])

  const doSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = await searchBrands(q)
    setSearchResults(results)
    setSearching(false)
  }, [])

  const selectDomain = (newDomain: string | null) => {
    if (!description) return
    const key = description.trim().toUpperCase()
    const cache = readCache()
    cache[key] = newDomain
    writeCache(cache)
    setDomain(newDomain)
    setImgError(false)
    setOpen(false)
  }

  const showFallback = domain === undefined || !domain || imgError

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
        title="Click to change logo"
      >
        {showFallback ? (
          <div
            className="rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
          >
            {(description || "?").charAt(0).toUpperCase()}
          </div>
        ) : (
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
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 z-50 w-72 bg-card border rounded-xl shadow-lg p-2"
        >
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Search brand..."
              className="w-full pl-7 pr-2 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => selectDomain(null)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-accent text-left"
            >
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                —
              </div>
              <span className="text-muted-foreground">No logo</span>
            </button>

            {searching && (
              <p className="text-xs text-muted-foreground px-2 py-2">Searching...</p>
            )}

            {searchResults.map((r) => (
              <button
                key={r.domain}
                type="button"
                onClick={() => selectDomain(r.domain)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-accent text-left ${r.domain === domain ? "bg-accent" : ""}`}
              >
                {r.icon ? (
                  <img src={r.icon} alt="" className="w-6 h-6 rounded-full object-contain" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {(r.name || r.domain).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name || r.domain}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.domain}</p>
                </div>
              </button>
            ))}

            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <p className="text-xs text-muted-foreground px-2 py-2">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
