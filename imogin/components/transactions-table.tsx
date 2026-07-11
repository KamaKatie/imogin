"use client"

import { useCallback, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { formatRelativeDate } from "@/lib/dates"
import { getCategoryIcon } from "@/lib/icons"
import type { ColumnDef } from "@tanstack/react-table"

export interface TransactionRow {
  id: string
  amount: number
  description: string | null
  date: string
  type: string
  is_split: boolean
  user_id: string
  payer_name: string
  accounts: { id: string; name: string; is_shared: boolean } | null
  categories: { id: string; name: string; type: string; icon: string | null; color: string | null } | null
}

export interface FilterOption {
  id: string
  label: string
}

interface TransactionsTableProps {
  data: TransactionRow[]
  totalCount: number
  page: number
  pageSize: number
  search: string
  sort: string
  sortDir: "asc" | "desc"
  accounts: FilterOption[]
  categories: FilterOption[]
  payers: FilterOption[]
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 min-w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm text-muted-foreground"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function TransactionsTable({
  data,
  totalCount,
  page,
  pageSize,
  search,
  sort,
  sortDir,
  accounts,
  categories,
  payers,
}: TransactionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const accountFilter = searchParams.get("account") || ""
  const categoryFilter = searchParams.get("category") || ""
  const payerFilter = searchParams.get("payer") || ""

  const updateParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(overrides)) {
        if (value) sp.set(key, value)
        else sp.delete(key)
      }
      const qs = sp.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const columns: ColumnDef<TransactionRow>[] = useMemo(
    () => [
      {
        id: "date",
        accessorKey: "date",
        header: "Date",
        enableSorting: true,
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue() as string
          return (
            <span className="whitespace-nowrap" title={val}>
              {formatRelativeDate(val)}
            </span>
          )
        },
        meta: { className: "whitespace-nowrap" },
      },
      {
        id: "paid_by",
        header: "Paid by",
        accessorKey: "payer_name",
        enableSorting: false,
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
        meta: { className: "whitespace-nowrap" },
      },
      {
        id: "description",
        accessorKey: "description",
        header: "Description",
        enableSorting: true,
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="truncate">
              {t.description || (t.type === "transfer" ? "Transfer" : "—")}
              {t.is_split && (
                <span className="ml-1.5 text-[11px] text-orange-500 font-medium">(split)</span>
              )}
              {t.type === "transfer" && (
                <span className="ml-1.5 text-[11px] text-blue-500 font-medium">(transfer)</span>
              )}
            </div>
          )
        },
            meta: { className: "text-left" },
      },
      {
        id: "category",
        header: "Category",
        enableSorting: false,
        size: 140,
        cell: ({ row }) => {
          const cat = row.original.categories
          if (!cat) return <span className="text-muted-foreground">—</span>
          return (
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full"
              style={{ backgroundColor: (cat.color || "#6B7280") + "18", color: cat.color || undefined }}
            >
              {cat.icon ? getCategoryIcon(cat.icon, 16) : "•"}
            </span>
          )
        },
            meta: { className: "text-left" },
      },
      {
        id: "account",
        header: "Account",
        enableSorting: false,
        size: 140,
        cell: ({ row }) => {
          const a = row.original.accounts
          if (!a) return <span className="text-muted-foreground">—</span>
          return (
            <span className="whitespace-nowrap">
              {a.name}
              {a.is_shared && (
                <span className="ml-1 text-[11px] text-primary font-medium">(Shared)</span>
              )}
            </span>
          )
        },
        meta: { className: "whitespace-nowrap" },
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        enableSorting: true,
        size: 130,
        cell: ({ row }) => {
          const t = row.original
          const sign = t.type === "income" ? "+" : t.type === "transfer" ? "↔" : "-"
          const color =
            t.type === "income"
              ? "text-green-600"
              : t.type === "transfer"
                ? "text-blue-600"
                : "text-red-600"
          return (
            <span className={`font-medium tabular-nums ${color}`}>
              {sign}¥{Math.abs(t.amount).toLocaleString()}
            </span>
          )
        },
            meta: { className: "text-left" },
      },
    ],
    [],
  )

  const toolbarRight = (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterSelect
        label="Account"
        value={accountFilter}
        options={accounts}
        onChange={(v) =>
          updateParams({ account: v || undefined, page: undefined })
        }
      />
      <FilterSelect
        label="Category"
        value={categoryFilter}
        options={categories}
        onChange={(v) =>
          updateParams({ category: v || undefined, page: undefined })
        }
      />
      <FilterSelect
        label="Who paid"
        value={payerFilter}
        options={payers}
        onChange={(v) =>
          updateParams({ payer: v || undefined, page: undefined })
        }
      />
    </div>
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      sort={sort}
      sortDir={sortDir}
      searchValue={search}
      searchPlaceholder="Search transactions..."
      emptyMessage={
        search ? "No transactions match your search" : "No transactions yet"
      }
      toolbarRight={toolbarRight}
      onPageChange={(p) => updateParams({ page: p > 1 ? String(p) : undefined })}
      onPageSizeChange={(s) =>
        updateParams({
          pageSize: s !== 25 ? String(s) : undefined,
          page: undefined,
        })
      }
      onSearchChange={(q) =>
        updateParams({
          q: q || undefined,
          page: undefined,
        })
      }
      onSortChange={(field, dir) =>
        updateParams({
          sort: field && field !== "date" ? field : undefined,
          order: dir !== "desc" ? dir : undefined,
        })
      }
      onRowClick={(row) => router.push(`/transactions/${row.id}`)}
    />
  )
}
