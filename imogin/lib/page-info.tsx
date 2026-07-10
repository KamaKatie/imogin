"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type BreadcrumbItem = { label: string; href?: string }

const PageInfoContext = createContext<{
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (items: BreadcrumbItem[]) => void
}>({ breadcrumbs: [], setBreadcrumbs: () => {} })

export function PageInfoProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  return (
    <PageInfoContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </PageInfoContext.Provider>
  )
}

export function usePageInfo() {
  return useContext(PageInfoContext)
}

export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { setBreadcrumbs } = usePageInfo()

  useEffect(() => {
    setBreadcrumbs(items)
    return () => setBreadcrumbs([])
  }, [items, setBreadcrumbs])

  return null
}
