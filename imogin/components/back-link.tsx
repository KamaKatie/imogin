"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const parentLabels: Record<string, string> = {
  "/accounts": "accounts",
  "/transactions": "transactions",
  "/goals": "goals",
  "/subscriptions": "subscriptions",
  "/settings": "settings",
  "/budgets": "budgets",
  "/reports": "reports",
}

export function BackLink({ fallbackHref, fallbackLabel }: { fallbackHref?: string; fallbackLabel?: string }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  let parentHref = "/"
  let parentLabel = "home"

  for (let i = segments.length - 1; i >= 0; i--) {
    const candidate = "/" + segments.slice(0, i).join("/")
    if (parentLabels[candidate]) {
      parentHref = candidate
      parentLabel = parentLabels[candidate]
      break
    }
  }

  const href = parentHref !== "/" ? parentHref : (fallbackHref || "/")
  const label = parentHref !== "/" ? parentLabel : (fallbackLabel || "home")

  return (
    <Link href={href} className="text-sm text-primary hover:underline">
      &larr; Back to {label}
    </Link>
  )
}
