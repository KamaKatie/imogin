"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/partner", label: "Partnership" },
  { href: "/settings/appearance", label: "Appearance" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-4">
      {/* Mobile tabs */}
      <div className="lg:hidden flex gap-1 text-sm border-b border-border">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2.5 font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Desktop sidebar + content */}
      <div className="hidden lg:flex gap-8">
        <nav className="w-48 shrink-0 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      {/* Mobile content */}
      <div className="lg:hidden">
        {children}
      </div>
    </div>
  )
}
