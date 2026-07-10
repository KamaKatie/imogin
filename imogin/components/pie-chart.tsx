"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getCategoryIcon } from "@/lib/icons"

interface PieChartDonutProps {
  data: Array<{ name: string; value: number; color: string | null; icon: string | null }>;
}

interface TooltipPayload {
  value: number
  payload: { icon: string | null; color: string | null }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white text-gray-900 border rounded-md shadow-lg px-3 py-2 text-xs flex items-center gap-2">
      <span style={{ color: d.color || "#6B7280" }}>
        {getCategoryIcon(d.icon, 14)}
      </span>
      <span className="font-medium tabular-nums">¥{payload[0].value.toLocaleString()}</span>
    </div>
  )
}

export function PieChartDonut({ data }: PieChartDonutProps) {
  return (
    <div className="flex flex-col justify-center items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={220} className="max-w-[220px]">
        <PieChart>
          <Pie
            data={data.map((d) => ({ ...d, fill: d.color || "#6B7280" }))}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={90}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || "#6B7280"} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 text-sm">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color || "#6B7280" }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-medium tabular-nums">¥{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
