"use client"

import { usePathname } from "next/navigation"

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/accounts": "Accounts",
  "/bills": "Bills",
  "/goals": "Goals",
  "/budgets": "Budgets",
  "/reports": "Reports",
  "/settings": "Settings",
  "/settings/partner": "Partnership",
  "/settings/categories": "Categories",
  "/bills/calendar": "Bills Calendar",
}

export function TopBar() {
  const pathname = usePathname()
  const title = routeTitles[pathname] || pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || ""

  return (
    <header className="h-14 border-b bg-card flex items-center px-6 shrink-0">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  )
}
