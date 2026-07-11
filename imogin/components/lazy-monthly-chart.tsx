"use client"

import dynamic from "next/dynamic"

export const LazyMonthlyLineChart = dynamic(
  () => import("@/components/monthly-line-chart").then((m) => m.MonthlyLineChart),
  {
    loading: () => (
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    ),
    ssr: false,
  },
)
