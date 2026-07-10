"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { usePageInfo } from "@/lib/page-info"

const segmentLabels: Record<string, string> = {
  "": "Home",
  accounts: "Accounts",
  transactions: "Transactions",
  goals: "Goals",
  bills: "Bills",
  budgets: "Budgets",
  reports: "Reports",
  settings: "Settings",
  categories: "Categories",
  partner: "Partnership",
  calendar: "Calendar",
}

function deriveBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return [{ label: "Dashboard" }]

  const items: { label: string; href?: string }[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const label = segmentLabels[segment]
    if (!label) continue

    if (i === segments.length - 1) {
      items.push({ label })
    } else {
      items.push({ label, href: "/" + segments.slice(0, i + 1).join("/") })
    }
  }

  if (items.length === 0) {
    const last = segmentLabels[segments[0]]
    return [{ label: last || "Home" }]
  }

  return items
}

export function TopBar() {
  const pathname = usePathname()
  const { breadcrumbs } = usePageInfo()
  const items = breadcrumbs.length > 0 ? breadcrumbs : deriveBreadcrumbs(pathname)

  return (
    <header className="h-14 border-b bg-card flex items-center px-6 shrink-0">
      <nav className="flex items-center gap-2 text-sm">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
            {item.href ? (
              <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
