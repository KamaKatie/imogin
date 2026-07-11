"use client"

import { useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface MonthlyData {
  label: string
  total: number
}

interface EnrichedData extends MonthlyData {
  prevTotal: number | null
}

interface CategoryBarChartProps {
  data: MonthlyData[]
  color?: string
}

const ranges = [
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "1 year", months: 12 },
  { label: "2 years", months: 24 },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EnrichedData }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const change = d.prevTotal !== null ? d.total - d.prevTotal : null
  const pct = d.prevTotal !== null && d.prevTotal > 0 ? ((d.total - d.prevTotal) / d.prevTotal) * 100 : null

  return (
    <div className="bg-white text-gray-900 border rounded-md shadow-lg px-3 py-2 text-xs min-w-[120px]">
      <p className="font-medium mb-1">{d.label}</p>
      <p className="font-medium">¥{d.total.toLocaleString()}</p>
      {change !== null && (
        <p className={`mt-0.5 ${change > 0 ? "text-red-600" : change < 0 ? "text-green-600" : "text-muted-foreground"}`}>
          {change > 0 ? "+" : ""}¥{change.toLocaleString()}
          {pct !== null && (
            <span className="ml-1">
              ({change > 0 ? "+" : ""}{pct.toFixed(1)}%)
            </span>
          )}
        </p>
      )}
    </div>
  )
}

export function CategoryBarChart({ data, color = "#ef4444" }: CategoryBarChartProps) {
  const [rangeMonths, setRangeMonths] = useState(6)

  const chartData = useMemo(() => {
    const sliced = rangeMonths === data.length ? data : data.slice(-rangeMonths)
    return sliced.map((d, i) => ({
      ...d,
      prevTotal: i > 0 ? sliced[i - 1].total : null,
    }))
  }, [data, rangeMonths])

  return (
    <div>
      <div className="flex justify-end gap-1 text-xs mb-4">
        {ranges.map(r => (
          <button
            key={r.months}
            onClick={() => setRangeMonths(r.months)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              rangeMonths === r.months
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" strokeOpacity={0.3} />
            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" strokeOpacity={0.3} tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
    </div>
  )
}
