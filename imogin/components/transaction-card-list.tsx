"use client"

import Link from "next/link"
import { getCategoryIcon } from "@/lib/icons"
import { BrandLogo } from "@/components/brand-logo"
import type { TransactionRow } from "@/components/transactions-table"

interface TransactionCardListProps {
  data: TransactionRow[]
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" })
}

function groupByDate(data: TransactionRow[]) {
  const groups: Record<string, TransactionRow[]> = {}
  for (const t of data) {
    const key = t.date
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export function TransactionCardList({ data }: TransactionCardListProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>No transactions yet</p>
      </div>
    )
  }

  const grouped = groupByDate(data)

  return (
    <div className="space-y-4">
      {grouped.map(([date, transactions]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">{formatDateHeader(date)}</h3>
          <div className="rounded-xl border bg-card divide-y">
            {transactions.map((t) => {
              const sign = t.type === "income" ? "+" : t.type === "transfer" ? "↔" : "-"
              const color =
                t.type === "income"
                  ? "text-green-600"
                  : t.type === "transfer"
                    ? ""
                    : "text-red-600"
              const cat = t.categories
              return (
                <Link
                  key={t.id}
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BrandLogo
                      description={t.description}
                      fallback={
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: (cat?.color || "#6B7280") + "18" }}
                        >
                          <span style={{ color: cat?.color || "#6B7280" }}>
                            {cat?.icon ? getCategoryIcon(cat.icon, 16) : "•"}
                          </span>
                        </div>
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.description || (t.type === "transfer" ? "Transfer" : "—")}
                        {t.is_split && (
                          <span className="ml-1 text-[10px] text-orange-500 font-medium">(split)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.payer_name}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium tabular-nums shrink-0 ml-3 ${color}`}>
                    {sign}¥{Math.abs(t.amount).toLocaleString()}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
