"use client"

import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"

interface TransactionItem {
  id: string
  amount: number
  date: string
  type?: string
  description: string | null
  href?: string
  subtitle?: string
  showSign?: boolean
  limit?: number
}

interface SimpleTransactionListProps {
  transactions: TransactionItem[]
  limit?: number
}

export function SimpleTransactionList({ transactions, limit = 10 }: SimpleTransactionListProps) {
  const items = transactions.slice(0, limit)

  return (
    <div className="divide-y">
      {items.map((t) => {
        const sign = t.type === "income" ? "+" : t.type === "transfer" ? "↔" : t.showSign === false ? "" : "-"
        const color = t.type === "income" ? "text-green-600" : t.type === "transfer" ? "" : "text-red-600"
        const content = (
          <>
            <BrandLogo
              description={t.description}
              fallback={
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs text-muted-foreground">
                  {(t.description || "—").charAt(0).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.description || "—"}</p>
              <p className="text-xs text-muted-foreground">{t.subtitle || t.date}</p>
            </div>
            <span className={`text-sm font-medium tabular-nums shrink-0 ${t.showSign === false ? "" : color}`}>
              {sign}¥{Math.abs(t.amount).toLocaleString()}
            </span>
          </>
        )

        if (t.href) {
          return (
            <Link key={t.id} href={t.href} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0 hover:bg-accent/50 transition-colors -mx-2 px-2 rounded-lg">
              {content}
            </Link>
          )
        }

        return (
          <div key={t.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            {content}
          </div>
        )
      })}
    </div>
  )
}
