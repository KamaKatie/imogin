"use client"

import dynamic from "next/dynamic"

export const SankeyChart = dynamic(
  () => import("@/components/sankey-chart").then((m) => m.SankeyChart),
  {
    loading: () => (
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    ),
    ssr: false,
  },
)
