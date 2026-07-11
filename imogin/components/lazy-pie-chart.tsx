"use client"

import dynamic from "next/dynamic"

export const LazyPieChartDonut = dynamic(
  () => import("@/components/pie-chart").then((m) => m.PieChartDonut),
  {
    loading: () => (
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    ),
    ssr: false,
  },
)
