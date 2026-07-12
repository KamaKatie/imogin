"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface MonthlyData {
  label: string
  totalIncome: number
  totalSpent: number
}

interface MonthlyLineChartProps {
  data: MonthlyData[]
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white text-gray-900 border rounded-md shadow-lg px-3 py-2 text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: ¥{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

const lines = [
  { key: "totalIncome" as const, label: "Income", color: "#22c55e" },
  { key: "totalSpent" as const, label: "Expenses", color: "#ef4444" },
  { key: "net" as const, label: "Net", color: "#3b82f6", dashed: true },
]

const ranges = [
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "1 year", months: 12 },
  { label: "2 years", months: 24 },
]

export function MonthlyLineChart({ data }: MonthlyLineChartProps) {
  const [visible, setVisible] = useState<Set<string>>(new Set(lines.map(l => l.key)))
  const [rangeMonths, setRangeMonths] = useState(12)

  const chartData = useMemo(() => {
    const sliced = rangeMonths === data.length ? data : data.slice(-rangeMonths)
    return sliced.map(d => ({
      ...d,
      net: d.totalIncome - d.totalSpent,
    }))
  }, [data, rangeMonths])

  const toggle = (key: string) => {
    setVisible(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-3 text-xs overflow-x-auto scrollbar-thin">
          {lines.map(l => (
            <label key={l.key} className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={visible.has(l.key)}
                onChange={() => toggle(l.key)}
                style={{ accentColor: l.color }}
                className="size-3"
              />
              {l.label}
            </label>
          ))}
        </div>

        <div className="flex gap-1 text-xs overflow-x-auto scrollbar-thin">
          {ranges.map(r => (
            <button
              key={r.months}
              onClick={() => setRangeMonths(r.months)}
              className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                rangeMonths === r.months
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="currentColor" strokeOpacity={0.3} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} stroke="currentColor" strokeOpacity={0.3} tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`} width={45} />
          <Tooltip content={<CustomTooltip />} />
          {lines.map(l => {
            if (!visible.has(l.key)) return null
            return (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={l.color}
                strokeWidth={2}
                strokeDasharray={l.dashed ? "5 3" : undefined}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
